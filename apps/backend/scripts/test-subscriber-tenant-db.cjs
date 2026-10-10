const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { DataSource } = require('typeorm');
const { Subscriber } = require('./g1-subscriber/modules/email-marketing/entities/subscriber.entity.js');
const { Group } = require('./g1-subscriber/modules/email-marketing/entities/group.entity.js');
const { Segment } = require('./g1-subscriber/modules/email-marketing/entities/segment.entity.js');
const { SubscriberService } = require('./g1-subscriber/modules/email-marketing/subscriber.service.js');
const { activeMigrations } = require('./g1-subscriber/core/database/migration-catalog.js');
if (process.env.G1_SUBSCRIBER_ISOLATED !== '1') throw new Error('Isolated acceptance marker required');
const source = new DataSource({ type: 'postgres', host: 'postgres-test', port: 5432, username: 'g0_test', password: 'g0_ephemeral_local_only', database: 'affexai_g0_ephemeral', entities: [Subscriber, Group, Segment], migrations: activeMigrations, synchronize: false });
(async () => {
  await source.initialize();
  try {
    await source.runMigrations({ transaction: 'all' });
    const history = await source.query('SELECT name FROM migrations ORDER BY id');
    assert.equal(history.length, 13);
    assert.equal(history[5].name, 'SubscriberTenantEmailUnique1791374400000');
    assert.equal(history[6].name, 'CortexOutbox1791378000000');
    assert.equal((await source.runMigrations({ transaction: 'all' })).length, 0);
    const runner = source.createQueryRunner();
    await runner.connect(); await runner.startTransaction();
    try {
      const subscribers = runner.manager.getRepository(Subscriber);
      const groups = runner.manager.getRepository(Group);
      const segments = runner.manager.getRepository(Segment);
      const ownGroup = await groups.save(groups.create({ name: 'Own fixture', tenantId: 'fixture-a' }));
      const foreignGroup = await groups.save(groups.create({ name: 'Foreign fixture', tenantId: 'fixture-b' }));
      const ownSegment = await segments.save(segments.create({ name: 'Own fixture', tenantId: 'fixture-a' }));
      const foreignSegment = await segments.save(segments.create({ name: 'Foreign fixture', tenantId: 'fixture-b' }));
      const service = new SubscriberService(subscribers, {}, { validateEmail: async () => ({ status: 'valid' }) }, { getTenantId: () => 'fixture-a' }, groups, segments);
      const relationEmail = `${randomUUID()}@relations-fixture.example`;
      await assert.rejects(service.create({ email: relationEmail, groups: [foreignGroup.id] }), /relation not found/);
      await assert.rejects(service.create({ email: relationEmail, segments: [foreignSegment.id] }), /relation not found/);
      const local = await service.create({ email: relationEmail, groups: [ownGroup.id], segments: [ownSegment.id] });
      await assert.rejects(service.update(local.id, { groups: [foreignGroup.id] }), /relation not found/);
      await assert.rejects(service.update(local.id, { tenantId: 'fixture-b' }), /Unsupported recipient fields/);
      assert.deepEqual((await subscribers.findOneByOrFail({ id: local.id })).groups, [ownGroup.id]);
      await subscribers.update({ id: local.id }, { status: 'bounced', isDoubleOptIn: true, optInToken: 'stale-token' });
      await service.unsubscribe(relationEmail);
      const suppressed = await subscribers.findOneByOrFail({ id: local.id });
      assert.equal(suppressed.status, 'bounced'); assert.equal(suppressed.isDoubleOptIn, false); assert.equal(suppressed.optInToken, null);
      const email = `${randomUUID()}@subscriber-fixture.example`;
      await runner.query('INSERT INTO subscribers (tenant_id,email) VALUES ($1,$3),($2,$3)', ['fixture-a', 'fixture-b', email]);
      assert.equal((await runner.query('SELECT id FROM subscribers WHERE email=$1', [email])).length, 2);
      await runner.query('SAVEPOINT duplicate_email');
      await assert.rejects(runner.query('INSERT INTO subscribers (tenant_id,email) VALUES ($1,$2)', ['fixture-a', email]), error => error.code === '23505');
      await runner.query('ROLLBACK TO SAVEPOINT duplicate_email');
      const legacy = `${randomUUID()}@legacy-fixture.example`;
      await runner.query('INSERT INTO subscribers (tenant_id,email) VALUES (NULL,$1)', [legacy]);
      await runner.query('SAVEPOINT duplicate_legacy');
      await assert.rejects(runner.query('INSERT INTO subscribers (tenant_id,email) VALUES (NULL,$1)', [legacy]), error => error.code === '23505');
      await runner.query('ROLLBACK TO SAVEPOINT duplicate_legacy');
      const migration = new activeMigrations[5]();
      await assert.rejects(migration.down(runner), /cross-tenant duplicates/);
      assert.equal((await runner.query('SELECT id FROM subscribers WHERE email=$1', [email])).length, 2);
    } finally { await runner.rollbackTransaction(); await runner.release(); }
    console.log('PASS: canonical migrations=13; repeat=0; two-tenant email allowed; same-tenant/null-tenant duplicates rejected; unsafe downgrade refused; actual service local relations accepted and foreign create/update denied; fixture rows rolled back');
  } finally { await source.destroy(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
