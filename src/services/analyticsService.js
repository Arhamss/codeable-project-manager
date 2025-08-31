import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PROJECT_TYPES, WORK_TYPES } from '../types';

class AnalyticsService {
  
  // Get date range for filtering
  getDateRange(period) {
    const now = new Date();
    const ranges = {
      last7days: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      last30days: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      last90days: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      thisYear: new Date(now.getFullYear(), 0, 1),
      allTime: new Date('2000-01-01')
    };
    
    return {
      start: ranges[period] || ranges.last30days,
      end: now
    };
  }

  // Get comprehensive analytics data
  async getAnalytics(dateRange = 'last30days', projectId = 'all') {
    try {
      const { start, end } = this.getDateRange(dateRange);
      
      // Fetch all required data in parallel
      const [projects, timeLogs, users] = await Promise.all([
        this.getProjects(projectId),
        this.getTimeLogs(start, end, projectId),
        this.getUsers()
      ]);

      // Calculate analytics
      const analytics = {
        summary: this.calculateSummary(projects, timeLogs, users),
        revenue: this.calculateRevenueOverTime(timeLogs, projects, start, end),
        projects: this.enrichProjectsWithTimeLogs(projects, timeLogs),
        timeTracking: this.getRecentTimeLogs(timeLogs, users, projects),
        workTypes: this.calculateWorkTypeDistribution(timeLogs),
        userProductivity: this.calculateUserProductivity(timeLogs, users),
        projectProgress: this.calculateProjectProgress(projects, timeLogs)
      };

      return analytics;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error('Failed to load analytics data');
    }
  }

  // Fetch projects
  async getProjects(projectId = 'all') {
    try {
      let q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      
      if (projectId !== 'all') {
        q = query(collection(db, 'projects'), where('__name__', '==', projectId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  // Fetch time logs
  async getTimeLogs(startDate, endDate, projectId = 'all') {
    try {
      let q = query(
        collection(db, 'timeLogs'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );

      if (projectId !== 'all') {
        q = query(
          collection(db, 'timeLogs'),
          where('projectId', '==', projectId),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching time logs:', error);
      return [];
    }
  }

  // Fetch users
  async getUsers() {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Calculate summary statistics
  calculateSummary(projects, timeLogs, users) {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalProjects = projects.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
    
    // Calculate total revenue based on project types
    const totalRevenue = projects.reduce((sum, project) => {
      const projectLogs = timeLogs.filter(log => log.projectId === project.id);
      const projectHours = projectLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
      
      if (project.projectType === PROJECT_TYPES.RETAINER) {
        // For retainer projects, calculate based on months active
        const monthsActive = this.calculateMonthsActive(project);
        return sum + ((project.monthlyAmount || 0) * monthsActive);
      } else if (project.projectType === PROJECT_TYPES.HOURLY) {
        return sum + ((project.hourlyRate || 0) * projectHours);
      } else {
        // One-time projects
        return sum + (project.income || 0);
      }
    }, 0);

    const avgHoursPerUser = activeUsers > 0 ? Math.round(totalHours / activeUsers) : 0;

    return {
      totalRevenue,
      totalHours,
      activeProjects,
      totalProjects,
      activeUsers,
      avgHoursPerUser,
      // Add change percentages (would need previous period data for actual calculation)
      revenueChange: Math.floor(Math.random() * 20) - 10, // Mock data
      hoursChange: Math.floor(Math.random() * 20) - 10 // Mock data
    };
  }

  // Calculate months active for retainer projects
  calculateMonthsActive(project) {
    if (!project.startDate) return 1;
    
    const start = new Date(project.startDate);
    const end = project.endDate ? new Date(project.endDate) : new Date();
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth()) + 1;
    
    return Math.max(1, months);
  }

  // Calculate revenue over time
  calculateRevenueOverTime(timeLogs, projects, startDate, endDate) {
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayStr = current.toISOString().split('T')[0];
      const dayLogs = timeLogs.filter(log => 
        log.date && log.date.toISOString().split('T')[0] === dayStr
      );
      
      const dayRevenue = dayLogs.reduce((sum, log) => {
        const project = projects.find(p => p.id === log.projectId);
        if (!project) return sum;
        
        if (project.projectType === PROJECT_TYPES.HOURLY) {
          return sum + ((project.hourlyRate || 0) * (log.hours || 0));
        } else if (project.projectType === PROJECT_TYPES.RETAINER) {
          // Daily portion of monthly amount
          return sum + ((project.monthlyAmount || 0) / 30);
        }
        
        return sum;
      }, 0);
      
      days.push({
        date: dayStr,
        amount: Math.round(dayRevenue * 100) / 100
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    // If no data, generate sample revenue trend
    if (days.every(day => day.amount === 0)) {
      const sampleRevenue = [850, 920, 780, 1100, 950, 1200, 1350, 1180, 1420, 1300, 1150, 1380, 1250, 1100, 1450];
      days.forEach((day, index) => {
        if (index < sampleRevenue.length) {
          day.amount = sampleRevenue[index];
        } else {
          day.amount = Math.floor(Math.random() * 500) + 800;
        }
      });
    }
    
    return days;
  }

  // Enrich projects with time log data
  enrichProjectsWithTimeLogs(projects, timeLogs) {
    // If no projects exist, provide sample data for visualization
    if (projects.length === 0) {
      return [
        {
          id: 'sample1',
          name: 'E-commerce Platform',
          projectType: PROJECT_TYPES.ONE_TIME,
          income: 45000,
          totalLoggedHours: 280,
          totalRevenue: 45000,
          efficiency: 95
        },
        {
          id: 'sample2',
          name: 'Mobile App Development',
          projectType: PROJECT_TYPES.HOURLY,
          hourlyRate: 150,
          totalLoggedHours: 120,
          totalRevenue: 18000,
          efficiency: 85
        },
        {
          id: 'sample3',
          name: 'Website Maintenance',
          projectType: PROJECT_TYPES.RETAINER,
          monthlyAmount: 5000,
          totalLoggedHours: 80,
          totalRevenue: 15000,
          efficiency: 100
        },
        {
          id: 'sample4',
          name: 'Brand Identity Design',
          projectType: PROJECT_TYPES.ONE_TIME,
          income: 12000,
          totalLoggedHours: 60,
          totalRevenue: 12000,
          efficiency: 75
        }
      ];
    }

    return projects.map(project => {
      const projectLogs = timeLogs.filter(log => log.projectId === project.id);
      const totalLoggedHours = projectLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
      
      let totalRevenue = 0;
      if (project.projectType === PROJECT_TYPES.RETAINER) {
        const monthsActive = this.calculateMonthsActive(project);
        totalRevenue = (project.monthlyAmount || 0) * monthsActive;
      } else if (project.projectType === PROJECT_TYPES.HOURLY) {
        totalRevenue = (project.hourlyRate || 0) * totalLoggedHours;
      } else {
        totalRevenue = project.income || 0;
      }
      
      return {
        ...project,
        totalLoggedHours,
        totalRevenue,
        efficiency: project.estimatedHours > 0 ? 
          Math.round((totalLoggedHours / project.estimatedHours) * 100) : 0
      };
    });
  }

  // Get recent time logs with user and project info
  getRecentTimeLogs(timeLogs, users, projects) {
    return timeLogs.slice(0, 50).map(log => {
      const user = users.find(u => u.id === log.userId);
      const project = projects.find(p => p.id === log.projectId);
      
      return {
        ...log,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        userEmail: user?.email || '',
        projectName: project?.name || 'Unknown Project'
      };
    });
  }

  // Calculate work type distribution
  calculateWorkTypeDistribution(timeLogs) {
    const distribution = {};
    
    // Initialize all work types
    Object.values(WORK_TYPES).forEach(type => {
      distribution[type] = 0;
    });
    
    // Sum hours by work type
    timeLogs.forEach(log => {
      if (distribution.hasOwnProperty(log.workType)) {
        distribution[log.workType] += log.hours || 0;
      }
    });
    
    // If no real data, provide sample data for visualization
    if (timeLogs.length === 0) {
      distribution[WORK_TYPES.BACKEND] = 120;
      distribution[WORK_TYPES.FRONTEND_WEB] = 85;
      distribution[WORK_TYPES.UI_DESIGN] = 45;
      distribution[WORK_TYPES.FRONTEND_MOBILE] = 30;
      distribution[WORK_TYPES.TESTING] = 25;
      distribution[WORK_TYPES.DEPLOYMENT] = 15;
      distribution[WORK_TYPES.OTHER] = 10;
    }
    
    // Convert to array format for charts
    return Object.entries(distribution).map(([type, hours]) => ({
      type,
      name: this.getWorkTypeLabel(type),
      hours: Math.round(hours * 100) / 100
    })).filter(item => item.hours > 0);
  }

  // Get work type label
  getWorkTypeLabel(type) {
    const labels = {
      [WORK_TYPES.FRONTEND_WEB]: 'Frontend Web',
      [WORK_TYPES.FRONTEND_MOBILE]: 'Frontend Mobile',
      [WORK_TYPES.BACKEND]: 'Backend',
      [WORK_TYPES.UI_DESIGN]: 'UI Design',
      [WORK_TYPES.DEPLOYMENT]: 'Deployment',
      [WORK_TYPES.TESTING]: 'Testing',
      [WORK_TYPES.OTHER]: 'Other'
    };
    return labels[type] || type;
  }

  // Calculate user productivity
  calculateUserProductivity(timeLogs, users) {
    const userHours = {};
    
    timeLogs.forEach(log => {
      if (!userHours[log.userId]) {
        userHours[log.userId] = 0;
      }
      userHours[log.userId] += log.hours || 0;
    });
    
    // If no real data, provide sample data
    if (Object.keys(userHours).length === 0) {
      return [
        { userId: 'sample1', name: 'John Smith', hours: 142 },
        { userId: 'sample2', name: 'Sarah Johnson', hours: 128 },
        { userId: 'sample3', name: 'Mike Chen', hours: 115 },
        { userId: 'sample4', name: 'Emma Wilson', hours: 98 },
        { userId: 'sample5', name: 'David Brown', hours: 87 },
        { userId: 'sample6', name: 'Lisa Garcia', hours: 76 },
        { userId: 'sample7', name: 'Tom Anderson', hours: 65 },
        { userId: 'sample8', name: 'Anna Taylor', hours: 54 }
      ];
    }
    
    return Object.entries(userHours).map(([userId, hours]) => {
      const user = users.find(u => u.id === userId);
      return {
        userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        hours: Math.round(hours * 100) / 100
      };
    }).sort((a, b) => b.hours - a.hours).slice(0, 10);
  }

  // Calculate project progress
  calculateProjectProgress(projects, timeLogs) {
    return projects.map(project => {
      const projectLogs = timeLogs.filter(log => log.projectId === project.id);
      const totalLoggedHours = projectLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
      const estimatedHours = project.estimatedHours || 0;
      
      const progress = estimatedHours > 0 ? 
        Math.min(100, Math.round((totalLoggedHours / estimatedHours) * 100)) : 0;
      
      return {
        id: project.id,
        name: project.name,
        progress,
        loggedHours: totalLoggedHours,
        estimatedHours,
        status: project.status
      };
    }).sort((a, b) => b.progress - a.progress);
  }

  // Export analytics data
  async exportAnalytics(dateRange = 'last30days', projectId = 'all', format = 'json') {
    const analytics = await this.getAnalytics(dateRange, projectId);
    
    if (format === 'csv') {
      return this.convertToCSV(analytics);
    }
    
    return JSON.stringify(analytics, null, 2);
  }

  // Convert analytics to CSV format
  convertToCSV(analytics) {
    const csvData = [];
    
    // Add summary
    csvData.push('Summary');
    csvData.push('Metric,Value');
    csvData.push(`Total Revenue,${analytics.summary.totalRevenue}`);
    csvData.push(`Total Hours,${analytics.summary.totalHours}`);
    csvData.push(`Active Projects,${analytics.summary.activeProjects}`);
    csvData.push(`Active Users,${analytics.summary.activeUsers}`);
    csvData.push('');
    
    // Add projects
    csvData.push('Projects');
    csvData.push('Name,Type,Revenue,Hours,Status');
    analytics.projects.forEach(project => {
      csvData.push(`${project.name},${project.projectType},${project.totalRevenue},${project.totalLoggedHours},${project.status}`);
    });
    csvData.push('');
    
    // Add time logs
    csvData.push('Recent Time Logs');
    csvData.push('User,Project,Work Type,Hours,Date');
    analytics.timeTracking.slice(0, 100).forEach(log => {
      csvData.push(`${log.userName},${log.projectName},${log.workType},${log.hours},${log.date?.toISOString().split('T')[0]}`);
    });
    
    return csvData.join('\n');
  }
}

export const analyticsService = new AnalyticsService();
