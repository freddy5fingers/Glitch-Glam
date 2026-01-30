
import { supabase } from "./supabase";
import { User } from '../types';

export const userService = {
  // Fetch full user profile
  async getUserData(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) return null;

      // Map DB columns (snake_case) to App types (camelCase)
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        favorites: data.favorites || [],
        customProducts: data.custom_products || [],
        savedLooks: data.saved_looks || []
      } as User;

    } catch (error) {
      console.error("Failed to fetch user data:", error);
      return null;
    }
  },

  // Update specific fields on the user record
  async updateUserData(userId: string, data: Partial<User>) {
    try {
      // Map App types to DB columns
      const updates: any = {};
      if (data.favorites) updates.favorites = data.favorites;
      if (data.customProducts) updates.custom_products = data.customProducts;
      if (data.savedLooks) updates.saved_looks = data.savedLooks;
      if (data.name) updates.name = data.name;

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update user data:", error);
    }
  },

  // Subscribe to live changes
  subscribe(userId: string, onUpdate: (data: User) => void): () => void {
    try {
      const channel = supabase
        .channel(`public:users:id=eq.${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
          (payload) => {
            const newData = payload.new;
            // Map incoming realtime data
            const user: User = {
                id: newData.id,
                email: newData.email,
                name: newData.name,
                favorites: newData.favorites || [],
                customProducts: newData.custom_products || [],
                savedLooks: newData.saved_looks || []
            };
            onUpdate(user);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Failed to subscribe to live updates:", error);
      return () => {}; 
    }
  }
};
