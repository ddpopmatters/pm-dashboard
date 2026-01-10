// Supabase client and API wrapper - matching PM-Productivity-Tool pattern
import { APP_CONFIG, Logger } from './config.js';

// Supabase client instance
let supabase = null;

// Initialize Supabase client
export const initSupabase = async () => {
  if (supabase) return supabase;

  if (!APP_CONFIG.SUPABASE_ENABLED) {
    Logger.warn('Supabase is disabled in config');
    return null;
  }

  try {
    // Wait for Supabase SDK to load (if using CDN)
    if (window.supabaseReady) {
      await window.supabaseReady;
    }

    const { createClient } = window.supabase || (await import('@supabase/supabase-js'));

    supabase = createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    Logger.debug('Supabase client initialized');
    return supabase;
  } catch (error) {
    Logger.error(error, 'Failed to initialize Supabase');
    return null;
  }
};

// Get current Supabase client
export const getSupabase = () => supabase;

// ============================================
// SUPABASE API WRAPPER
// Matching PM-Productivity-Tool patterns
// ============================================

export const SUPABASE_API = {
  // ==========================================
  // ENTRIES (Content Calendar)
  // ==========================================

  fetchEntries: async (options = {}) => {
    await initSupabase();
    if (!supabase) return [];

    try {
      let query = supabase
        .from('entries')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (options.month) {
        const startDate = `${options.month}-01`;
        const endDate = `${options.month}-31`;
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error(error, 'fetchEntries');
        return [];
      }

      return (data || []).map(SUPABASE_API.mapEntryToApp);
    } catch (error) {
      Logger.error(error, 'fetchEntries');
      return [];
    }
  },

  fetchEntryById: async (id) => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('entries').select('*').eq('id', id).single();

      if (error) {
        Logger.error(error, 'fetchEntryById');
        return null;
      }

      return data ? SUPABASE_API.mapEntryToApp(data) : null;
    } catch (error) {
      Logger.error(error, 'fetchEntryById');
      return null;
    }
  },

  saveEntry: async (entry, userEmail) => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const dbEntry = SUPABASE_API.mapEntryToDb(entry, userEmail);

      const { data, error } = await supabase.from('entries').upsert(dbEntry).select().single();

      if (error) {
        Logger.error(error, 'saveEntry');
        return null;
      }

      // Log activity
      await SUPABASE_API.logActivity({
        actionType: entry.id ? 'update' : 'create',
        targetType: 'entry',
        targetId: data.id,
        targetTitle: entry.caption?.substring(0, 50) || 'Untitled',
        details: { date: entry.date, status: entry.status },
      });

      return data ? SUPABASE_API.mapEntryToApp(data) : null;
    } catch (error) {
      Logger.error(error, 'saveEntry');
      return null;
    }
  },

  deleteEntry: async (id) => {
    await initSupabase();
    if (!supabase) return false;

    try {
      // Soft delete
      const { error } = await supabase
        .from('entries')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        Logger.error(error, 'deleteEntry');
        return false;
      }

      await SUPABASE_API.logActivity({
        actionType: 'delete',
        targetType: 'entry',
        targetId: id,
        targetTitle: '',
      });

      return true;
    } catch (error) {
      Logger.error(error, 'deleteEntry');
      return false;
    }
  },

  // ==========================================
  // IDEAS
  // ==========================================

  fetchIdeas: async (options = {}) => {
    await initSupabase();
    if (!supabase) return [];

    try {
      let query = supabase.from('ideas').select('*').order('created_at', { ascending: false });

      if (options.month) {
        query = query.eq('target_month', options.month);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error(error, 'fetchIdeas');
        return [];
      }

      return (data || []).map(SUPABASE_API.mapIdeaToApp);
    } catch (error) {
      Logger.error(error, 'fetchIdeas');
      return [];
    }
  },

  saveIdea: async (idea, userEmail) => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const dbIdea = SUPABASE_API.mapIdeaToDb(idea, userEmail);

      const { data, error } = await supabase.from('ideas').upsert(dbIdea).select().single();

      if (error) {
        Logger.error(error, 'saveIdea');
        return null;
      }

      return data ? SUPABASE_API.mapIdeaToApp(data) : null;
    } catch (error) {
      Logger.error(error, 'saveIdea');
      return null;
    }
  },

  deleteIdea: async (id) => {
    await initSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('ideas').delete().eq('id', id);

      if (error) {
        Logger.error(error, 'deleteIdea');
        return false;
      }

      return true;
    } catch (error) {
      Logger.error(error, 'deleteIdea');
      return false;
    }
  },

  // ==========================================
  // LINKEDIN SUBMISSIONS
  // ==========================================

  fetchLinkedInSubmissions: async (options = {}) => {
    await initSupabase();
    if (!supabase) return [];

    try {
      let query = supabase
        .from('linkedin_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (options.month) {
        const startDate = `${options.month}-01`;
        const endDate = `${options.month}-31`;
        query = query.gte('target_date', startDate).lte('target_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error(error, 'fetchLinkedInSubmissions');
        return [];
      }

      return (data || []).map(SUPABASE_API.mapLinkedInToApp);
    } catch (error) {
      Logger.error(error, 'fetchLinkedInSubmissions');
      return [];
    }
  },

  saveLinkedInSubmission: async (submission, userEmail) => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const dbSubmission = SUPABASE_API.mapLinkedInToDb(submission, userEmail);

      const { data, error } = await supabase
        .from('linkedin_submissions')
        .upsert(dbSubmission)
        .select()
        .single();

      if (error) {
        Logger.error(error, 'saveLinkedInSubmission');
        return null;
      }

      return data ? SUPABASE_API.mapLinkedInToApp(data) : null;
    } catch (error) {
      Logger.error(error, 'saveLinkedInSubmission');
      return null;
    }
  },

  deleteLinkedInSubmission: async (id) => {
    await initSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('linkedin_submissions').delete().eq('id', id);

      if (error) {
        Logger.error(error, 'deleteLinkedInSubmission');
        return false;
      }

      return true;
    } catch (error) {
      Logger.error(error, 'deleteLinkedInSubmission');
      return false;
    }
  },

  // ==========================================
  // TESTING FRAMEWORKS
  // ==========================================

  fetchTestingFrameworks: async () => {
    await initSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('testing_frameworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        Logger.error(error, 'fetchTestingFrameworks');
        return [];
      }

      return data || [];
    } catch (error) {
      Logger.error(error, 'fetchTestingFrameworks');
      return [];
    }
  },

  saveTestingFramework: async (framework) => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('testing_frameworks')
        .upsert(framework)
        .select()
        .single();

      if (error) {
        Logger.error(error, 'saveTestingFramework');
        return null;
      }

      return data;
    } catch (error) {
      Logger.error(error, 'saveTestingFramework');
      return null;
    }
  },

  deleteTestingFramework: async (id) => {
    await initSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('testing_frameworks').delete().eq('id', id);

      if (error) {
        Logger.error(error, 'deleteTestingFramework');
        return false;
      }

      return true;
    } catch (error) {
      Logger.error(error, 'deleteTestingFramework');
      return false;
    }
  },

  // ==========================================
  // GUIDELINES
  // ==========================================

  fetchGuidelines: async () => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('guidelines')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error && error.code !== 'PGRST116') {
        // Not found is ok
        Logger.error(error, 'fetchGuidelines');
        return null;
      }

      return data ? SUPABASE_API.mapGuidelinesToApp(data) : null;
    } catch (error) {
      Logger.error(error, 'fetchGuidelines');
      return null;
    }
  },

  saveGuidelines: async (guidelines) => {
    await initSupabase();
    if (!supabase) return false;

    try {
      const dbGuidelines = SUPABASE_API.mapGuidelinesToDb(guidelines);

      const { error } = await supabase.from('guidelines').upsert(dbGuidelines);

      if (error) {
        Logger.error(error, 'saveGuidelines');
        return false;
      }

      return true;
    } catch (error) {
      Logger.error(error, 'saveGuidelines');
      return false;
    }
  },

  // ==========================================
  // USER PROFILES
  // ==========================================

  fetchUserProfiles: async () => {
    await initSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        Logger.error(error, 'fetchUserProfiles');
        return [];
      }

      return data || [];
    } catch (error) {
      Logger.error(error, 'fetchUserProfiles');
      return [];
    }
  },

  fetchCurrentUserProfile: async () => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        Logger.error(error, 'fetchCurrentUserProfile');
        return null;
      }

      return data;
    } catch (error) {
      Logger.error(error, 'fetchCurrentUserProfile');
      return null;
    }
  },

  updateUserProfile: async (profileData) => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('auth_user_id', user.id)
        .select()
        .single();

      if (error) {
        Logger.error(error, 'updateUserProfile');
        return null;
      }

      return data;
    } catch (error) {
      Logger.error(error, 'updateUserProfile');
      return null;
    }
  },

  // ==========================================
  // ACTIVITY LOG
  // ==========================================

  logActivity: async (activity) => {
    await initSupabase();
    if (!supabase) return false;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('activity_log').insert({
        action_type: activity.actionType,
        target_type: activity.targetType,
        target_id: activity.targetId,
        target_title: activity.targetTitle,
        actor_email: user?.email || window.__currentUserEmail || 'unknown',
        actor_name: window.__currentUserName || 'Unknown',
        details: activity.details || {},
        related_users: activity.relatedUsers || [],
      });

      if (error) {
        Logger.error(error, 'logActivity');
        return false;
      }

      return true;
    } catch (error) {
      Logger.error(error, 'logActivity');
      return false;
    }
  },

  fetchRecentActivity: async (limit = 50) => {
    await initSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        Logger.error(error, 'fetchRecentActivity');
        return [];
      }

      return data || [];
    } catch (error) {
      Logger.error(error, 'fetchRecentActivity');
      return [];
    }
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  fetchNotifications: async (limit = 30) => {
    await initSupabase();
    if (!supabase) return [];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        Logger.error(error, 'fetchNotifications');
        return [];
      }

      return data || [];
    } catch (error) {
      Logger.error(error, 'fetchNotifications');
      return [];
    }
  },

  markNotificationRead: async (id) => {
    await initSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);

      if (error) {
        Logger.error(error, 'markNotificationRead');
        return false;
      }

      return true;
    } catch (error) {
      Logger.error(error, 'markNotificationRead');
      return false;
    }
  },

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  subscribeToEntries: (callback) => {
    if (!supabase) return null;

    return supabase
      .channel('entries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, (payload) => {
        Logger.debug('Entries change:', payload);
        callback(payload);
      })
      .subscribe();
  },

  // ==========================================
  // DATA MAPPING FUNCTIONS
  // ==========================================

  mapEntryToApp: (row) => ({
    id: row.id,
    date: row.date,
    platforms: row.platforms || [],
    assetType: row.asset_type,
    caption: row.caption,
    platformCaptions: row.platform_captions || {},
    firstComment: row.first_comment,
    approvalDeadline: row.approval_deadline,
    status: row.status,
    approvers: row.approvers || [],
    author: row.author,
    campaign: row.campaign,
    contentPillar: row.content_pillar,
    previewUrl: row.preview_url,
    checklist: row.checklist || {},
    analytics: row.analytics || {},
    workflowStatus: row.workflow_status,
    statusDetail: row.status_detail,
    aiFlags: row.ai_flags || [],
    aiScore: row.ai_score || {},
    testingFrameworkId: row.testing_framework_id,
    testingFrameworkName: row.testing_framework_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
  }),

  mapEntryToDb: (entry, userEmail) => ({
    id: entry.id || undefined,
    date: entry.date,
    platforms: entry.platforms || [],
    asset_type: entry.assetType || 'Design',
    caption: entry.caption,
    platform_captions: entry.platformCaptions || {},
    first_comment: entry.firstComment,
    approval_deadline: entry.approvalDeadline,
    status: entry.status || 'Pending',
    approvers: entry.approvers || [],
    author: entry.author,
    author_email: userEmail,
    campaign: entry.campaign,
    content_pillar: entry.contentPillar,
    preview_url: entry.previewUrl,
    checklist: entry.checklist || {},
    analytics: entry.analytics || {},
    workflow_status: entry.workflowStatus || 'Draft',
    status_detail: entry.statusDetail,
    ai_flags: entry.aiFlags || [],
    ai_score: entry.aiScore || {},
    testing_framework_id: entry.testingFrameworkId,
    testing_framework_name: entry.testingFrameworkName,
  }),

  mapIdeaToApp: (row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    notes: row.notes,
    links: row.links || [],
    attachments: row.attachments || [],
    inspiration: row.inspiration,
    createdBy: row.created_by,
    targetDate: row.target_date,
    targetMonth: row.target_month,
    createdAt: row.created_at,
  }),

  mapIdeaToDb: (idea, userEmail) => ({
    id: idea.id || undefined,
    type: idea.type || 'Other',
    title: idea.title,
    notes: idea.notes,
    links: idea.links || [],
    attachments: idea.attachments || [],
    inspiration: idea.inspiration,
    created_by: idea.createdBy,
    created_by_email: userEmail,
    target_date: idea.targetDate,
    target_month: idea.targetMonth || (idea.targetDate ? idea.targetDate.substring(0, 7) : null),
  }),

  mapLinkedInToApp: (row) => ({
    id: row.id,
    submissionType: row.submission_type,
    status: row.status,
    title: row.title,
    postCopy: row.post_copy,
    comments: row.comments,
    owner: row.owner,
    submitter: row.submitter,
    links: row.links || [],
    attachments: row.attachments || [],
    targetDate: row.target_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }),

  mapLinkedInToDb: (submission, userEmail) => ({
    id: submission.id || undefined,
    submission_type: submission.submissionType || 'My own account',
    status: submission.status || 'Draft',
    title: submission.title,
    post_copy: submission.postCopy,
    comments: submission.comments,
    owner: submission.owner,
    owner_email: userEmail,
    submitter: submission.submitter,
    submitter_email: userEmail,
    links: submission.links || [],
    attachments: submission.attachments || [],
    target_date: submission.targetDate,
  }),

  mapGuidelinesToApp: (row) => ({
    id: row.id,
    charLimits: row.char_limits || {},
    bannedWords: row.banned_words || [],
    requiredPhrases: row.required_phrases || [],
    languageGuide: row.language_guide,
    hashtagTips: row.hashtag_tips,
    teamsWebhookUrl: row.teams_webhook_url,
  }),

  mapGuidelinesToDb: (guidelines) => ({
    id: 'default',
    char_limits: guidelines.charLimits || {},
    banned_words: guidelines.bannedWords || [],
    required_phrases: guidelines.requiredPhrases || [],
    language_guide: guidelines.languageGuide,
    hashtag_tips: guidelines.hashtagTips,
    teams_webhook_url: guidelines.teamsWebhookUrl,
  }),
};

// ============================================
// AUTHENTICATION
// ============================================

export const AUTH = {
  signIn: async (email, password) => {
    await initSupabase();
    if (!supabase) return { error: 'Supabase not initialized' };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Logger.error(error, 'signIn');
        return { error: error.message };
      }

      // Set global user info for logging
      window.__currentUserEmail = data.user?.email;

      return { data };
    } catch (error) {
      Logger.error(error, 'signIn');
      return { error: error.message };
    }
  },

  signUp: async (email, password, name) => {
    await initSupabase();
    if (!supabase) return { error: 'Supabase not initialized' };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        Logger.error(error, 'signUp');
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      Logger.error(error, 'signUp');
      return { error: error.message };
    }
  },

  signOut: async () => {
    await initSupabase();
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      window.__currentUserEmail = null;
      window.__currentUserName = null;
    } catch (error) {
      Logger.error(error, 'signOut');
    }
  },

  getSession: async () => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      Logger.error(error, 'getSession');
      return null;
    }
  },

  getUser: async () => {
    await initSupabase();
    if (!supabase) return null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      Logger.error(error, 'getUser');
      return null;
    }
  },

  onAuthStateChange: (callback) => {
    if (!supabase) return null;

    return supabase.auth.onAuthStateChange((event, session) => {
      Logger.debug('Auth state change:', event);
      if (session?.user) {
        window.__currentUserEmail = session.user.email;
      }
      callback(event, session);
    });
  },
};
