import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Users, Plus, Trash2, LogOut, Globe, Bell } from 'lucide-react';
import { TouristLayout } from '@/components/tourist/TouristLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TrustedContact, Profile } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function TouristProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchContacts();
    }
  }, [user]);

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    if (data) setProfile(data as Profile);
  }

  async function fetchContacts() {
    const { data } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', user?.id);
    if (data) setContacts(data as TrustedContact[]);
  }

  const handleUpdateProfile = async (field: string, value: string) => {
    if (!user) return;
    
    await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('user_id', user.id);
    
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
    
    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved',
    });
  };

  const handleAddContact = async () => {
    if (!user || !newContact.name || !newContact.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in name and phone number',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await supabase
      .from('trusted_contacts')
      .insert({
        user_id: user.id,
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive',
      });
      return;
    }

    setContacts(prev => [...prev, data as TrustedContact]);
    setNewContact({ name: '', phone: '', relationship: '' });
    setDialogOpen(false);
    
    toast({
      title: 'Contact Added',
      description: `${newContact.name} has been added to your trusted contacts`,
    });
  };

  const handleDeleteContact = async (contactId: string) => {
    await supabase
      .from('trusted_contacts')
      .delete()
      .eq('id', contactId);
    
    setContacts(prev => prev.filter(c => c.id !== contactId));
    
    toast({
      title: 'Contact Removed',
      description: 'Contact has been removed from your list',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <TouristLayout>
      <div className="space-y-4 animate-in">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {/* User Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile?.full_name || ''}
                onChange={(e) => handleUpdateProfile('full_name', e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted rounded-md text-sm">
                  +91
                </div>
                <Input
                  id="phone"
                  value={profile?.phone?.replace('+91', '') || user?.phone?.replace('+91', '') || ''}
                  disabled
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={profile?.language || 'en'}
                onValueChange={(value) => handleUpdateProfile('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trusted Contacts */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Trusted Contacts
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Trusted Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-muted rounded-md text-sm">
                        +91
                      </div>
                      <Input
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ 
                          ...newContact, 
                          phone: e.target.value.replace(/\D/g, '').slice(0, 10) 
                        })}
                        placeholder="9876543210"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship (optional)</Label>
                    <Input
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                      placeholder="e.g., Family, Friend"
                    />
                  </div>
                  <Button onClick={handleAddContact} className="w-full">
                    Add Contact
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trusted contacts added yet
              </p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              These contacts will be alerted when you use the "Watch Me" feature or SOS
            </p>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full text-destructive hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </TouristLayout>
  );
}
