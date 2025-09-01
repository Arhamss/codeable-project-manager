import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { migratePoliciestoFirebase } from '../../utils/migratePoliciestoFirebase';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const MigrationTools = () => {
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigration = async () => {
    if (window.confirm('This will upload existing policy PDFs to Firebase Storage and create database entries. Continue?')) {
      setIsMigrating(true);
      try {
        await migratePoliciestoFirebase();
        toast.success('Migration completed successfully!');
      } catch (error) {
        console.error('Migration failed:', error);
        toast.error('Migration failed. Check console for details.');
      } finally {
        setIsMigrating(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-800 rounded-lg border border-dark-700 p-6"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
          <Upload className="w-5 h-5 text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Policy Migration Tool
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Upload existing policy PDFs from the public/assets/policies directory to Firebase Storage 
            and create database entries. This should be run once to migrate existing files.
          </p>
          
          <div className="flex items-center space-x-2 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <p className="text-yellow-200 text-xs">
              Make sure Firebase Storage rules allow uploads before running this migration.
            </p>
          </div>
          
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className="btn-primary flex items-center space-x-2"
          >
            {isMigrating ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isMigrating ? 'Migrating...' : 'Run Migration'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MigrationTools;
