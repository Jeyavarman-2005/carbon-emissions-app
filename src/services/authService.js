import supabase from './supabaseClient';

/**
 * Service for handling user authentication operations
 */
export const authService = {
  /**
   * Creates a new user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
   */
  createNewUser: async (email, password) => {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`, // For email confirmation
          data: { // Additional user metadata
            first_name: '',
            last_name: ''
          }
        }
      });

      if (error) {
        console.error('User creation error:', error);
        return {
          success: false,
          data: null,
          error: error.message || 'Failed to create user'
        };
      }

      // Optionally create a corresponding record in your public.users table
      if (data?.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              created_at: new Date().toISOString()
            }
          ]);

        if (dbError) {
          console.error('Database user record creation failed:', dbError);
          // Continue despite this error - auth user was created
        }
      }

      return {
        success: true,
        data: {
          id: data.user?.id,
          email: data.user?.email,
          emailConfirmed: data.user?.email_confirmed_at !== null
        },
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in user creation:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Checks if a user already exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  checkUserExists: async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    return !!data;
  }
};

// Optional: Default export for backward compatibility
export default authService;