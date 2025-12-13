import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Car, CheckSquare, ChevronDown, Shield, MapPin, Phone } from 'lucide-react';
import { TouristLayout } from '@/components/tourist/TouristLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Scam, TransportService, ChecklistItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const DEFAULT_CHECKLIST = [
  { title: 'Save passport/ID copy', category: 'Documents' },
  { title: 'Register with embassy', category: 'Documents' },
  { title: 'Save emergency contacts', category: 'Safety' },
  { title: 'Download offline maps', category: 'Preparation' },
  { title: 'Learn basic Hindi phrases', category: 'Preparation' },
  { title: 'Carry sunscreen & water', category: 'Health' },
  { title: 'Keep medicines handy', category: 'Health' },
  { title: 'Note hotel address in Hindi', category: 'Safety' },
];

export default function SafetyTools() {
  const [scams, setScams] = useState<Scam[]>([]);
  const [transport, setTransport] = useState<TransportService[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    // Fetch scams
    const { data: scamsData } = await supabase.from('scams').select('*');
    if (scamsData) setScams(scamsData as Scam[]);

    // Fetch transport services
    const { data: transportData } = await supabase.from('transport_services').select('*');
    if (transportData) setTransport(transportData as TransportService[]);

    // Fetch or create checklist
    if (user) {
      const { data: checklistData } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('user_id', user.id);

      if (checklistData && checklistData.length > 0) {
        setChecklist(checklistData as ChecklistItem[]);
      } else {
        // Create default checklist
        const items = DEFAULT_CHECKLIST.map(item => ({
          user_id: user.id,
          title: item.title,
          category: item.category,
          is_completed: false,
        }));
        
        const { data: newItems } = await supabase
          .from('checklist_items')
          .insert(items)
          .select();
        
        if (newItems) setChecklist(newItems as ChecklistItem[]);
      }
    }
  }

  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    await supabase
      .from('checklist_items')
      .update({ is_completed: completed })
      .eq('id', itemId);

    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, is_completed: completed } : item
      )
    );
  };

  const filteredScams = scams.filter(
    scam =>
      scam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scam.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-danger text-danger-foreground';
      case 'medium':
        return 'bg-caution text-caution-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <TouristLayout>
      <div className="space-y-4 animate-in">
        <div>
          <h1 className="text-2xl font-bold">Safety Tools</h1>
          <p className="text-muted-foreground">Stay safe during your travels</p>
        </div>

        <Tabs defaultValue="scams" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scams" className="text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 mr-1 hidden sm:inline" />
              Scams
            </TabsTrigger>
            <TabsTrigger value="transport" className="text-xs sm:text-sm">
              <Car className="w-4 h-4 mr-1 hidden sm:inline" />
              Transport
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs sm:text-sm">
              <CheckSquare className="w-4 h-4 mr-1 hidden sm:inline" />
              Checklist
            </TabsTrigger>
          </TabsList>

          {/* Scams Database */}
          <TabsContent value="scams" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search scams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {filteredScams.map((scam) => (
                <AccordionItem
                  key={scam.id}
                  value={scam.id}
                  className="glass-card border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start gap-3 text-left">
                      <AlertTriangle className={cn(
                        'w-5 h-5 mt-0.5 flex-shrink-0',
                        scam.severity === 'high' ? 'text-danger' : 
                        scam.severity === 'medium' ? 'text-caution' : 'text-muted-foreground'
                      )} />
                      <div>
                        <p className="font-medium">{scam.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {scam.category}
                          </Badge>
                          <Badge className={cn('text-xs', getSeverityColor(scam.severity))}>
                            {scam.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {scam.description}
                    </p>
                    <div className="bg-safe/10 rounded-lg p-3">
                      <p className="text-sm font-medium text-safe mb-2">How to avoid:</p>
                      <ul className="text-sm space-y-1">
                        {scam.prevention_tips?.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-safe flex-shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          {/* Verified Transport */}
          <TabsContent value="transport" className="space-y-3 mt-4">
            {transport.map((service) => (
              <Card key={service.id} className="glass-card">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.service_type}</p>
                        {service.area && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {service.area}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {service.is_verified && (
                        <Badge className="bg-safe text-safe-foreground text-xs">
                          Verified
                        </Badge>
                      )}
                      {service.rating && (
                        <p className="text-sm mt-1">⭐ {service.rating}</p>
                      )}
                    </div>
                  </div>
                  {service.phone && (
                    <a
                      href={`tel:${service.phone}`}
                      className="mt-3 flex items-center gap-2 text-primary text-sm font-medium"
                    >
                      <Phone className="w-4 h-4" />
                      {service.phone}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Pre-Trip Checklist */}
          <TabsContent value="checklist" className="space-y-3 mt-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Pre-Trip Checklist</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {checklist.filter(i => i.is_completed).length}/{checklist.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.is_completed}
                      onCheckedChange={(checked) =>
                        handleChecklistToggle(item.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={item.id}
                      className={cn(
                        'text-sm cursor-pointer flex-1',
                        item.is_completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.title}
                    </label>
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TouristLayout>
  );
}
