const User = require('../models/mongodb/user.model');
const Source = require('../models/mongodb/source.model');
const Chunk = require('../models/mongodb/chunk.model');
const SearchHistory = require('../models/mongodb/searchHistory.model');
const logger = require('../utils/logger');

class UserService {
  async getUserStats(userId) {
    try {
      const [sourcesCount, chunksCount, searchCount] = await Promise.all([
        Source.countDocuments({ userId }),
        Chunk.countDocuments({ 
          sourceId: { 
            $in: await Source.find({ userId }).select('_id') 
          } 
        }),
        SearchHistory.countDocuments({ userId })
      ]);

      const recentSources = await Source.find({ userId })
        .sort({ ingestedAt: -1 })
        .limit(5)
        .select('name type ingestedAt stats');

      return {
        totalSources: sourcesCount,
        totalChunks: chunksCount,
        totalSearches: searchCount,
        recentSources
      };
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId, preferences) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { preferences },
        { new: true, runValidators: true }
      );

      return user.preferences;
    } catch (error) {
      logger.error('Update user preferences error:', error);
      throw error;
    }
  }

  async deleteUserData(userId) {
    try {
      // Get all user sources
      const sources = await Source.find({ userId });
      const sourceIds = sources.map(s => s._id);

      // Delete chunks
      const deleteResult = await Chunk.deleteMany({ sourceId: { $in: sourceIds } });
      
      // Delete sources
      await Source.deleteMany({ userId });
      
      // Delete search history
      await SearchHistory.deleteMany({ userId });

      // Note: Vector points in Qdrant should also be deleted
      // This would typically be done through a background job

      logger.info(`Deleted user data for user ${userId}: ${deleteResult.deletedCount} chunks`);

      return {
        deletedSources: sources.length,
        deletedChunks: deleteResult.deletedCount,
        deletedSearchHistory: await SearchHistory.countDocuments({ userId })
      };
    } catch (error) {
      logger.error('Delete user data error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
