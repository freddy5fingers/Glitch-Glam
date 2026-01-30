
import { supabase } from "./supabase";
import { User } from '../types';

const SESSION_KEY = 'glow_v8_session';

export const authService = {
  
  // Register a new user
  signUp: async (email: string, password: string, name: string): Promise<User> => {
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name } // Stored in auth.users metadata
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned from signup");

      const userId = authData.user.id;

      // 2. Create profile in 'users' table
      const newUserProfile = {
        id: userId,
        email,
        name,
        favorites: [],
        custom_products: [],
        saved_looks: []
      };

      const { error: dbError } = await supabase
        .from('users')
        .insert([newUserProfile]);

      if (dbError) {
        console.error("Profile creation error:", dbError);
        // Note: You might want to retry or handle this edge case
      }

      // 3. Return application User object
      const user: User = {
        id: userId,
        email,
        name,
        favorites: [],
        customProducts: [],
        savedLooks: []
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;

    } catch (err: any) {
      console.error("Signup Error:", err);
      throw new Error(err.message || "Signup failed");
    }
  },

  // Login existing user
  login: async (email: string, password: string): Promise<User> => {
    try {
      // 1. Login with Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned from login");

      const userId = authData.user.id;

      // 2. Fetch User Profile
      const { data: profile, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbError) throw dbError;

      // 3. Map to App User type (Snake_case to CamelCase)
      const user: User = {
        id: userId,
        email: profile.email,
        name: profile.name,
        favorites: profile.favorites || [],
        customProducts: profile.custom_products || [],
        savedLooks: profile.saved_looks || []
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;

    } catch (err: any) {
      console.error("Login Error:", err);
      throw new Error("Invalid email or password");
    }
  },

  // Check if currently logged in
  getCurrentUser: (): User | null => {
    // We rely on local storage for the synchronous check on load
    // but ideally we verify with supabase.auth.getSession()
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

  // Logout
  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout Error", e);
    }
  }
};
