import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGdprComplianceTables1728000000020 implements MigrationInterface {
  name = 'CreateGdprComplianceTables1760621189177';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create consent_records table
    await queryRunner.query(`
      CREATE TABLE consent_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subscriber_id UUID NOT NULL,
        email VARCHAR(255) NOT NULL,
        consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('EMAIL_MARKETING', 'DATA_PROCESSING', 'PROFILING', 'THIRD_PARTY_SHARING', 'ANALYTICS')),
        consent_status VARCHAR(20) NOT NULL CHECK (consent_status IN ('GIVEN', 'WITHDRAWN', 'EXPIRED', 'PENDING')),
        consent_date TIMESTAMP NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        consent_method VARCHAR(30) NOT NULL CHECK (consent_method IN ('EXPLICIT_OPT_IN', 'DOUBLE_OPT_IN', 'IMPLIED_CONSENT', 'LEGITIMATE_INTEREST', 'IMPORT')),
        legal_basis VARCHAR(30) NOT NULL CHECK (legal_basis IN ('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS')),
        data_processing_purposes JSON NOT NULL,
        retention_period INTEGER,
        withdrawal_date TIMESTAMP,
        withdrawal_reason VARCHAR(500),
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create data_subject_requests table
    await queryRunner.query(`
      CREATE TABLE data_subject_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL,
        request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICT_PROCESSING', 'DATA_PORTABILITY', 'OBJECT', 'WITHDRAW_CONSENT')),
        request_date TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXPIRED')),
        completion_date TIMESTAMP,
        verification_method VARCHAR(100) NOT NULL,
        request_details JSON,
        response_data JSON,
        notes TEXT,
        verification_token VARCHAR(255),
        verification_expiry TIMESTAMP,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for consent_records
    await queryRunner.query(`CREATE INDEX IDX_consent_records_email ON consent_records (email)`);
    await queryRunner.query(`CREATE INDEX IDX_consent_records_subscriber_id ON consent_records (subscriber_id)`);
    await queryRunner.query(`CREATE INDEX IDX_consent_records_consent_type_status ON consent_records (consent_type, consent_status)`);
    await queryRunner.query(`CREATE INDEX IDX_consent_records_consent_date ON consent_records (consent_date)`);

    // Create indexes for data_subject_requests
    await queryRunner.query(`CREATE INDEX IDX_data_subject_requests_email ON data_subject_requests (email)`);
    await queryRunner.query(`CREATE INDEX IDX_data_subject_requests_status ON data_subject_requests (status)`);
    await queryRunner.query(`CREATE INDEX IDX_data_subject_requests_request_type ON data_subject_requests (request_type)`);
    await queryRunner.query(`CREATE INDEX IDX_data_subject_requests_request_date ON data_subject_requests (request_date)`);

    // Create foreign key constraint for consent_records -> subscribers
    await queryRunner.query(`
      ALTER TABLE consent_records 
      ADD CONSTRAINT FK_consent_records_subscriber 
      FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE consent_records DROP CONSTRAINT IF EXISTS FK_consent_records_subscriber`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_consent_records_email`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_consent_records_subscriber_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_consent_records_consent_type_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_consent_records_consent_date`);

    await queryRunner.query(`DROP INDEX IF EXISTS IDX_data_subject_requests_email`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_data_subject_requests_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_data_subject_requests_request_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_data_subject_requests_request_date`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS data_subject_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS consent_records`);
  }
}