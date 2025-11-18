import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDashboardData() {
  try {
    console.log('📊 Checking Dashboard Data...\n');

    // Check pending companies
    const pendingCompanies = await prisma.company.count({
      where: { registration_status: "PENDING" }
    });
    console.log(`✅ Pending Companies (PENDING): ${pendingCompanies}`);

    // Check lowercase for comparison
    const pendingCompaniesLowercase = await prisma.company.count({
      where: { registration_status: "pending" }
    });
    console.log(`❌ Pending Companies (lowercase 'pending'): ${pendingCompaniesLowercase}`);

    // Check all companies
    const allCompanies = await prisma.company.findMany({
      select: { id: true, name: true, registration_status: true }
    });
    console.log(`\n📋 All Companies (${allCompanies.length}):`);
    allCompanies.forEach(c => {
      console.log(`  - ${c.name}: ${c.registration_status}`);
    });

    // Check students by faculty
    const skeStudents = await prisma.student.count({
      where: { faculty: "Software and Knowledge Engineering (SKE)" }
    });
    const cpeStudents = await prisma.student.count({
      where: { faculty: "Computer Engineering (CPE)" }
    });
    console.log(`\n👨‍🎓 Students:`);
    console.log(`  - SKE: ${skeStudents}`);
    console.log(`  - CPE: ${cpeStudents}`);

    // Check accepted applications by department
    const skeAccepted = await prisma.application.count({
      where: {
        student: { faculty: "Software and Knowledge Engineering (SKE)" },
        status: 4 // Offered
      }
    });
    const cpeAccepted = await prisma.application.count({
      where: {
        student: { faculty: "Computer Engineering (CPE)" },
        status: 4 // Offered
      }
    });
    console.log(`\n✅ Offered Applications (status: 4 - Offered):`);
    console.log(`  - SKE: ${skeAccepted}`);
    console.log(`  - CPE: ${cpeAccepted}`);

    // Success rate calculation
    const skeSuccessRate = skeStudents > 0 ? (skeAccepted / skeStudents) * 100 : 0;
    const cpeSuccessRate = cpeStudents > 0 ? (cpeAccepted / cpeStudents) * 100 : 0;
    console.log(`\n📊 Success Rate (Offered/Total Students):`);
    console.log(`  - SKE: ${skeSuccessRate.toFixed(1)}% (${skeAccepted}/${skeStudents})`);
    console.log(`  - CPE: ${cpeSuccessRate.toFixed(1)}% (${cpeAccepted}/${cpeStudents})`);

    // Check application statuses
    const appStatuses = await prisma.applicationStatus.findMany();
    console.log(`\n📝 Application Statuses:`);
    appStatuses.forEach(s => {
      console.log(`  - ID ${s.id}: ${s.name}`);
    });

    // Check job posts
    const totalJobPosts = await prisma.jobPost.count();
    console.log(`\n💼 Total Job Posts: ${totalJobPosts}`);

    // Check reports
    const totalReports = await prisma.report.count();
    console.log(`📢 Total Reports: ${totalReports}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDashboardData();
