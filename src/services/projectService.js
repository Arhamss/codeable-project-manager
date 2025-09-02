import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PROJECT_STATUS } from '../types';

class ProjectService {
  constructor() {
    this.projectsCollection = collection(db, 'projects');
    this.timeLogsCollection = collection(db, 'timeLogs');
  }

  // Create new project
  async createProject(projectData) {
    try {
      const docData = {
        ...projectData,
        status: projectData.status || PROJECT_STATUS.PLANNING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalLoggedHours: 0,
        isActive: true
      };

      const docRef = await addDoc(this.projectsCollection, docData);
      const createdProject = { id: docRef.id, ...docData };
      return createdProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Update project
  async updateProject(projectId, updateData) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(projectRef, dataToUpdate);
      return { id: projectId, ...dataToUpdate };
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Delete project (soft delete)
  async deleteProject(projectId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Get all active projects
  async getAllProjects() {
    try {
      // Get all projects without any filters to avoid composite index issues
      const querySnapshot = await getDocs(this.projectsCollection);
      const allProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));
      
      // Filter active projects and sort by createdAt on the client side
      const activeProjects = allProjects
        .filter(project => project.isActive !== false)
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB - dateA; // Descending order
        });
      
      // Fix any projects with future dates (this is a temporary fix)
      const fixedProjects = activeProjects.map(project => {
        if (project.createdAt && project.createdAt > new Date()) {
          // If createdAt is in the future, set it to now
          return {
            ...project,
            createdAt: new Date(),
            needsDateFix: true
          };
        }
        return project;
      });
      
      return fixedProjects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  // Get project by ID (includes inactive projects)
  async getProjectById(projectId) {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      
      if (projectDoc.exists()) {
        const data = projectDoc.data();
        const project = {
          id: projectDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        };
        
        // Ensure isActive is set if not present
        if (project.isActive === undefined) {
          project.isActive = true;
        }
        
        return project;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  // Fix project with future date (temporary method)
  async fixProjectDate(projectId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error fixing project date:', error);
      throw error;
    }
  }

  // Listen to projects in real-time
  subscribeToProjects(callback) {
    // Listen to all projects without filters to avoid composite index issues
    return onSnapshot(this.projectsCollection, (querySnapshot) => {
      const allProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));
      
      // Filter active projects and sort by createdAt on the client side
      const activeProjects = allProjects
        .filter(project => project.isActive !== false)
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB - dateA; // Descending order
        });
      
      callback(activeProjects);
    }, (error) => {
      console.error('Error listening to projects:', error);
      callback([]);
    });
  }

  // Log time for a project
  async logTime(timeLogData) {
    try {
      const docData = {
        ...timeLogData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.timeLogsCollection, docData);
      
      // Update project's total logged hours
      await this.updateProjectTotalHours(timeLogData.projectId);
      
      return { id: docRef.id, ...docData };
    } catch (error) {
      console.error('Error logging time:', error);
      throw error;
    }
  }

  // Update time log
  async updateTimeLog(timeLogId, updateData) {
    try {
      // Get the original time log to check if project changed
      const originalTimeLogDoc = await getDoc(doc(db, 'timeLogs', timeLogId));
      const originalData = originalTimeLogDoc.data();
      
      const timeLogRef = doc(db, 'timeLogs', timeLogId);
      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(timeLogRef, dataToUpdate);
      
      // Update project total hours
      const oldProjectId = originalData?.projectId;
      const newProjectId = updateData.projectId;
      
      // If project changed, update both old and new project totals
      if (oldProjectId && newProjectId && oldProjectId !== newProjectId) {
        await Promise.all([
          this.updateProjectTotalHours(oldProjectId),
          this.updateProjectTotalHours(newProjectId)
        ]);
      } else if (newProjectId) {
        // If project didn't change or we're just updating the same project
        await this.updateProjectTotalHours(newProjectId);
      } else if (oldProjectId) {
        // Fallback to update the original project
        await this.updateProjectTotalHours(oldProjectId);
      }
      
      return { id: timeLogId, ...dataToUpdate };
    } catch (error) {
      console.error('Error updating time log:', error);
      throw error;
    }
  }

  // Delete time log
  async deleteTimeLog(timeLogId, projectId) {
    try {
      await deleteDoc(doc(db, 'timeLogs', timeLogId));
      
      // Update project's total logged hours
      await this.updateProjectTotalHours(projectId);
    } catch (error) {
      console.error('Error deleting time log:', error);
      throw error;
    }
  }

  // Get time logs for a project
  async getProjectTimeLogs(projectId) {
    try {
      console.log('Fetching time logs for project:', projectId);
      
      const q = query(
        this.timeLogsCollection,
        where('projectId', '==', projectId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Time logs query result:', querySnapshot.docs.length, 'documents found');
      
      const timeLogs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Time log data:', { id: doc.id, projectId: data.projectId, hours: data.hours, date: data.date });
        
        // Convert Firestore Timestamp to Date object
        const processedDate = data.date?.toDate?.() || data.date;
        
        return {
          id: doc.id,
          ...data,
          date: processedDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        };
      });
      
      console.log('Processed time logs:', timeLogs);
      return timeLogs;
    } catch (error) {
      console.error('Error fetching time logs:', error);
      throw error;
    }
  }

  // Get time logs for a user
  async getUserTimeLogs(userId, limit = null) {
    try {
      let q = query(
        this.timeLogsCollection,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      // Only apply limit if it's a valid number
      if (limit && typeof limit === 'number' && limit > 0) {
        try {
          q = query(q, limit(limit));
        } catch (limitError) {
          console.warn('Firestore limit failed, will apply client-side limit:', limitError);
        }
      }
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to Date object
        const processedDate = data.date?.toDate?.() || data.date;
        
        return {
          id: doc.id,
          ...data,
          date: processedDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        };
      });

      // Apply limit on client side if Firestore limit failed
      if (limit && typeof limit === 'number' && limit > 0) {
        return results.slice(0, limit);
      }

      return results;
    } catch (error) {
      console.error('Error fetching user time logs:', error);
      throw error;
    }
  }

  // Update project total logged hours
  async updateProjectTotalHours(projectId) {
    try {
      const q = query(
        this.timeLogsCollection,
        where('projectId', '==', projectId)
      );
      
      const querySnapshot = await getDocs(q);
      const totalHours = querySnapshot.docs.reduce((total, doc) => {
        return total + (doc.data().hours || 0);
      }, 0);

      await updateDoc(doc(db, 'projects', projectId), {
        totalLoggedHours: totalHours,
        updatedAt: serverTimestamp()
      });

      return totalHours;
    } catch (error) {
      console.error('Error updating project total hours:', error);
      throw error;
    }
  }

  // Get project analytics
  async getProjectAnalytics(projectId) {
    try {
      console.log('Getting project analytics for:', projectId);
      
      const [project, timeLogs] = await Promise.all([
        this.getProjectById(projectId),
        this.getProjectTimeLogs(projectId)
      ]);

      console.log('Project data:', project);
      console.log('Time logs received:', timeLogs);

      if (!project) return null;

      // Calculate analytics
      const totalLoggedHours = timeLogs.reduce((total, log) => total + (log.hours || 0), 0);
      const totalEstimatedHours = Object.values(project.estimatedHours || {}).reduce((total, hours) => total + (hours || 0), 0);
      const remainingHours = Math.max(0, totalEstimatedHours - totalLoggedHours);
      const progressPercentage = totalEstimatedHours > 0 ? (totalLoggedHours / totalEstimatedHours) * 100 : 0;

      console.log('Calculated analytics:', {
        totalLoggedHours,
        totalEstimatedHours,
        remainingHours,
        progressPercentage
      });

      // Hours by work type
      const hoursByWorkType = timeLogs.reduce((acc, log) => {
        acc[log.workType] = (acc[log.workType] || 0) + (log.hours || 0);
        return acc;
      }, {});

      // Hours by user
      const hoursByUser = timeLogs.reduce((acc, log) => {
        acc[log.userId] = (acc[log.userId] || 0) + (log.hours || 0);
        return acc;
      }, {});

      // Recent activity (get more logs for daily breakdown)
      const recentLogs = timeLogs.slice(0, 50);

      const analytics = {
        project,
        totalLoggedHours,
        totalEstimatedHours,
        remainingHours,
        progressPercentage: Math.min(100, progressPercentage),
        hoursByWorkType,
        hoursByUser,
        recentLogs,
        timeLogsCount: timeLogs.length
      };

      console.log('Final analytics object:', analytics);
      return analytics;
    } catch (error) {
      console.error('Error getting project analytics:', error);
      throw error;
    }
  }

  // Get dashboard analytics
  async getDashboardAnalytics() {
    try {
      const [projects, allTimeLogs] = await Promise.all([
        this.getAllProjects(),
        this.getAllTimeLogs()
      ]);

      const activeProjects = projects.filter(p => p.status === PROJECT_STATUS.IN_PROGRESS);
      const completedProjects = projects.filter(p => p.status === PROJECT_STATUS.COMPLETED);
      
      const totalRevenue = projects.reduce((total, project) => total + (project.income || 0), 0);
      const totalCosts = projects.reduce((total, project) => {
        const costs = project.costs || {};
        return total + Object.values(costs).reduce((sum, cost) => sum + cost, 0);
      }, 0);

      const totalProfit = totalRevenue - totalCosts;
      const totalLoggedHours = allTimeLogs.reduce((total, log) => total + log.hours, 0);

      return {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        totalRevenue,
        totalCosts,
        totalProfit,
        totalLoggedHours,
        projects: projects.slice(0, 5), // Recent projects
        recentTimeLogs: allTimeLogs.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  // Get all time logs (for analytics)
  async getAllTimeLogs() {
    try {
      const q = query(
        this.timeLogsCollection,
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));
    } catch (error) {
      console.error('Error fetching all time logs:', error);
      throw error;
    }
  }
}

export const projectService = new ProjectService();
export default projectService;
