// Test role detection logic
const user = {
  "_id": "68dcdc7aff21eafa3cc285b3",
  "email": "admin@gmail.com",
  "role": "admin",
  "name": "Super Admin",
  "createdAt": "2025-10-01T07:47:05.915Z",
  "isActive": true
};

const isSuperAdmin = user?.role === 'admin' || user?.role === 'superadmin';
const isTeacher = user?.role === 'teacher';
const isStudent = user?.role === 'student';

console.log('User role:', user.role);
console.log('isSuperAdmin:', isSuperAdmin);
console.log('isTeacher:', isTeacher);
console.log('isStudent:', isStudent);

if (isSuperAdmin) {
  console.log('✅ Should show Super Admin features and Manage Users button');
} else {
  console.log('❌ Will not show Super Admin features');
}

