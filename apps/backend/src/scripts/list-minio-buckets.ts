import { S3Client, ListBucketsCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

async function listBuckets() {
  const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9007',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
  });

  try {
    const response = await s3Client.send(new ListBucketsCommand({}));
    console.log('📦 MinIO Buckets:');
    response.Buckets?.forEach(bucket => {
      console.log(`   - ${bucket.Name}`);
    });

    // Check if affexai-files exists
    const bucketName = 'affexai-files';
    const exists = response.Buckets?.some(b => b.Name === bucketName);
    
    if (!exists) {
      console.log(`\n⚠️  Bucket "${bucketName}" not found. Creating...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`✅ Created bucket: ${bucketName}`);
    } else {
      console.log(`\n✅ Bucket "${bucketName}" exists`);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

listBuckets();
