import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL이 설정되지 않았습니다.');
  console.error('   backend/.env 파일에 DATABASE_URL을 설정하세요.');
  process.exit(1);
}

// Prisma 7에서는 adapter 필요
// databaseUrl은 위에서 체크했으므로 string 타입 보장됨
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || '관리자';

  // 이미 존재하는지 확인
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('⚠️  이미 존재하는 이메일입니다:', email);
    console.log('   기존 계정을 사용하거나 다른 이메일을 사용하세요.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'admin',
    },
  });

  console.log('✅ 관리자 계정이 생성되었습니다!');
  console.log(`   이메일: ${user.email}`);
  console.log(`   이름: ${user.name}`);
  console.log(`   ID: ${user.id}`);
  console.log('\n📝 로그인 정보:');
  console.log(`   이메일: ${email}`);
  console.log(`   비밀번호: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
