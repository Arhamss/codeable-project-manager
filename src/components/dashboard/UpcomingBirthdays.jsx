import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gift, Cake, Users } from 'lucide-react';
import { userService } from '../../services/userService';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getDepartmentLabel } from '../../types';

const UpcomingBirthdays = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUpcomingBirthdays();
  }, []);

  const loadUpcomingBirthdays = async () => {
    try {
      setLoading(true);
      setError(null);
      const upcomingBirthdays = await userService.getUpcomingBirthdays();
      setBirthdays(upcomingBirthdays);
    } catch (error) {
      console.error('Error loading upcoming birthdays:', error);
      setError('Failed to load upcoming birthdays');
    } finally {
      setLoading(false);
    }
  };

  const formatBirthdayText = (birthday) => {
    if (birthday.isToday) {
      return 'Today!';
    } else if (birthday.daysUntil === 1) {
      return 'Tomorrow';
    } else if (birthday.isThisWeek) {
      return `In ${birthday.daysUntil} days`;
    } else if (birthday.isThisMonth) {
      return `In ${birthday.daysUntil} days`;
    } else {
      return birthday.upcomingBirthday.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getBirthdayIcon = (birthday) => {
    if (birthday.isToday) {
      return <Cake className="w-4 h-4 text-yellow-400" />;
    } else if (birthday.isThisWeek) {
      return <Gift className="w-4 h-4 text-pink-400" />;
    } else {
      return <Calendar className="w-4 h-4 text-blue-400" />;
    }
  };

  const getBirthdayColor = (birthday) => {
    if (birthday.isToday) {
      return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
    } else if (birthday.isThisWeek) {
      return 'bg-pink-600/20 text-pink-400 border-pink-600/30';
    } else if (birthday.isThisMonth) {
      return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
    } else {
      return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Cake className="w-5 h-5 mr-2 text-pink-400" />
            Upcoming Birthdays
          </h3>
          <p className="text-gray-400 text-sm">Team birthdays in the next 2 months</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" text="Loading birthdays..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Cake className="w-5 h-5 mr-2 text-pink-400" />
            Upcoming Birthdays
          </h3>
          <p className="text-gray-400 text-sm">Team birthdays in the next 2 months</p>
        </div>
        <div className="text-center py-8 text-red-400">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Cake className="w-5 h-5 mr-2 text-pink-400" />
          Upcoming Birthdays
        </h3>
        <p className="text-gray-400 text-sm">Team birthdays in the next 2 months</p>
      </div>
      
      <div className="space-y-3">
        {birthdays.length > 0 ? (
          birthdays.slice(0, 5).map((birthday, index) => (
            <motion.div
              key={birthday.user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getBirthdayColor(birthday)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Profile Picture or Initial */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {birthday.user.profilePictureUrl ? (
                      <img 
                        src={birthday.user.profilePictureUrl} 
                        alt={birthday.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      birthday.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white">
                      {birthday.user.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs">
                      {birthday.user.department && (
                        <span className="text-gray-400">
                          {getDepartmentLabel(birthday.user.department)}
                        </span>
                      )}
                      <span className="text-gray-400">
                        • Turning {birthday.age}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  {getBirthdayIcon(birthday)}
                  <span className="font-medium">
                    {formatBirthdayText(birthday)}
                  </span>
                </div>
              </div>
              
              {birthday.isToday && (
                <div className="mt-2 text-center">
                  <span className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-1 rounded-full">
                    🎉 Happy Birthday! 🎂
                  </span>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming birthdays</p>
            <p className="text-sm mt-1">Team members can add their birthdays in their profile settings</p>
          </div>
        )}
        
        {birthdays.length > 5 && (
          <div className="text-center pt-2">
            <span className="text-sm text-gray-400">
              +{birthdays.length - 5} more birthdays this month
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingBirthdays;
