import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const UserManagementScreen = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [teacherData, setTeacherData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'CSE'
  });

  const departments = [
    { value: 'CSE', label: 'Computer Science & Engineering' },
    { value: 'EEE', label: 'Electrical & Electronic Engineering' },
    { value: 'ME', label: 'Mechanical Engineering' },
    { value: 'CE', label: 'Civil Engineering' },
    { value: 'IPE', label: 'Industrial & Production Engineering' },
    { value: 'TEX', label: 'Textile Engineering' },
    { value: 'ARCH', label: 'Architecture' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllUsers();
      if (response.success) {
        setUsers(response.users);
        setFilteredUsers(response.users);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = (role) => {
    setSelectedRole(role);
    if (role === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === role));
    }
  };

  const createTeacher = async () => {
    if (!teacherData.name || !teacherData.email || !teacherData.password || !teacherData.department) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const response = await ApiService.createTeacher({
        ...teacherData,
        createdBy: currentUser._id
      });
      
      if (response.success) {
        Alert.alert('Success', 'Teacher created successfully');
        setShowCreateTeacher(false);
        setTeacherData({ name: '', email: '', password: '' });
        loadUsers();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create teacher');
    }
  };

  const deleteUser = async (userId, userName) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteUser(userId);
              if (response.success) {
                Alert.alert('Success', 'User deleted successfully');
                loadUsers();
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return '#ff6b35';
      case 'teacher': return '#4caf50';
      case 'student': return '#2196f3';
      default: return '#666';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'superadmin': return '👑';
      case 'teacher': return '👨‍🏫';
      case 'student': return '🎓';
      default: return '👤';
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userIcon}>{getRoleIcon(item.role)}</Text>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.studentId && (
            <Text style={styles.studentInfo}>ID: {item.studentId}</Text>
          )}
          {item.intake && (
            <Text style={styles.studentInfo}>Intake: {item.intake}</Text>
          )}
          <Text style={[styles.userRole, { color: getRoleColor(item.role) }]}>
            {item.role.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <View style={styles.userStatus}>
          <Text style={[styles.statusText, { color: item.isActive ? '#4caf50' : '#f44336' }]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        {item.role !== 'admin' && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteUser(item._id, item.name)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateTeacher(true)}
        >
          <Text style={styles.createButtonIcon}>👨‍🏫</Text>
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView 
          style={styles.filterContainer}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity 
            style={[styles.filterButton, selectedRole === 'all' && styles.activeFilter]}
            onPress={() => filterUsers('all')}
          >
            <Text style={[styles.filterText, selectedRole === 'all' && styles.activeFilterText]}>
              All ({users.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedRole === 'superadmin' && styles.activeFilter]}
            onPress={() => filterUsers('superadmin')}
          >
            <Text style={[styles.filterText, selectedRole === 'superadmin' && styles.activeFilterText]}>
              Super Admin ({users.filter(u => u.role === 'superadmin').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedRole === 'teacher' && styles.activeFilter]}
            onPress={() => filterUsers('teacher')}
          >
            <Text style={[styles.filterText, selectedRole === 'teacher' && styles.activeFilterText]}>
              Teachers ({users.filter(u => u.role === 'teacher').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedRole === 'student' && styles.activeFilter]}
            onPress={() => filterUsers('student')}
          >
            <Text style={[styles.filterText, selectedRole === 'student' && styles.activeFilterText]}>
              Students ({users.filter(u => u.role === 'student').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.userList}>
          {filteredUsers.map((item) => (
            <View key={item._id}>
              {renderUserItem({ item })}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showCreateTeacher}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Teacher Account</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Teacher Name"
              value={teacherData.name}
              onChangeText={(text) => setTeacherData({...teacherData, name: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={teacherData.email}
              onChangeText={(text) => setTeacherData({...teacherData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              value={teacherData.password}
              onChangeText={(text) => setTeacherData({...teacherData, password: text})}
              secureTextEntry
            />

            <Text style={styles.modalLabel}>Department</Text>
            <View style={styles.departmentPicker}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.value}
                  style={[
                    styles.departmentOption,
                    teacherData.department === dept.value && styles.selectedDepartment
                  ]}
                  onPress={() => setTeacherData({...teacherData, department: dept.value})}
                >
                  <Text style={[
                    styles.departmentText,
                    teacherData.department === dept.value && styles.selectedDepartmentText
                  ]}>
                    {dept.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateTeacher(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={createTeacher}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  createButtonIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    flexDirection: 'row',
    padding: 10,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  userList: {
    flex: 1,
    padding: 10,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  studentInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userActions: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStatus: {
    marginRight: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  departmentPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  departmentOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  selectedDepartment: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  departmentText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedDepartmentText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
});

export default UserManagementScreen;
