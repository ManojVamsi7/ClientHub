const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const list = async (query = {}) => {
  const { search } = query;
  let builder = db('students');

  if (search) {
    builder = builder.where((b) => {
      b.whereILike('name', `%${search}%`)
       .orWhereILike('student_id', `%${search}%`);
    });
  }

  const students = await builder.orderBy('name', 'asc');
  return students;
};

const bulkImport = async (studentsList) => {
  if (!Array.isArray(studentsList)) {
    throw new Error('Students list must be an array');
  }

  const results = {
    inserted: 0,
    updated: 0,
    errors: [],
  };

  await db.transaction(async (trx) => {
    for (const student of studentsList) {
      try {
        const { student_id, name, email, department, years_of_experience } = student;
        if (!student_id || !name) {
          results.errors.push(`Missing student_id or name for: ${JSON.stringify(student)}`);
          continue;
        }

        const existing = await trx('students').where('student_id', String(student_id)).first();
        if (existing) {
          await trx('students')
            .where('id', existing.id)
            .update({
              name,
              email: email || existing.email,
              department: department || existing.department,
              years_of_experience: years_of_experience !== undefined ? String(years_of_experience) : existing.years_of_experience,
            });
          results.updated++;
        } else {
          await trx('students').insert({
            id: uuidv4(),
            student_id: String(student_id),
            name,
            email: email || null,
            department: department || null,
            years_of_experience: years_of_experience !== undefined ? String(years_of_experience) : null,
          });
          results.inserted++;
        }
      } catch (err) {
        results.errors.push(`Error importing student ${student.student_id}: ${err.message}`);
      }
    }
  });

  return results;
};

module.exports = { list, bulkImport };
