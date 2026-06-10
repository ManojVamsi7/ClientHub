const db = require('./src/config/database');

async function clear() {
  try {
    console.log('Clearing database tables...');
    
    const deletedMistakes = await db('recruiter_mistakes').del();
    console.log(`Deleted ${deletedMistakes} recruiter mistakes.`);
    
    const deletedCalls = await db('interview_calls').del();
    console.log(`Deleted ${deletedCalls} interview calls.`);
    
    const deletedQueries = await db('client_queries').del();
    console.log(`Deleted ${deletedQueries} client queries.`);
    
    const deletedClients = await db('clients').del();
    console.log(`Deleted ${deletedClients} clients.`);
    
    const deletedStudents = await db('students').del();
    console.log(`Deleted ${deletedStudents} students.`);
    
    console.log('Database tables cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await db.destroy();
  }
}

clear();
