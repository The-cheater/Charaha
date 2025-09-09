"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SecurityIcon from '@mui/icons-material/Security'
import DeleteIcon from '@mui/icons-material/Delete'

export default function SettingsPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-funnel text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground font-dm-sans">
          Configure your TeamMemory workspace and integrations
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-funnel flex items-center">
                <IntegrationInstructionsIcon className="mr-2 h-5 w-5" />
                Connected Services
              </CardTitle>
              <CardDescription className="font-dm-sans">
                Manage your data source integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { name: 'Slack', status: 'Connected', icon: '💬' },
                { name: 'Google Docs', status: 'Connected', icon: '📄' },
                { name: 'Notion', status: 'Not Connected', icon: '📝' },
                { name: 'GitHub', status: 'Not Connected', icon: '🔧' },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <h3 className="font-medium font-dm-sans">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.status}</p>
                    </div>
                  </div>
                  <Button variant={service.status === 'Connected' ? 'outline' : 'gradient'}>
                    {service.status === 'Connected' ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-funnel flex items-center">
                <NotificationsIcon className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="font-dm-sans">
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'New search results', description: 'Get notified when new content matches your saved searches' },
                { label: 'Weekly digest', description: 'Receive a weekly summary of team activity' },
                { label: 'Integration updates', description: 'Notifications about new data sources' },
                { label: 'Security alerts', description: 'Important security and access notifications' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-dm-sans text-base">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-funnel flex items-center">
                <SecurityIcon className="mr-2 h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription className="font-dm-sans">
                Manage your account security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="font-dm-sans text-base">Session Timeout</Label>
                  <Select defaultValue="30">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-dm-sans text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="font-funnel flex items-center text-red-600">
                <DeleteIcon className="mr-2 h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="font-dm-sans">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg">
                <h3 className="font-medium font-dm-sans text-red-600 mb-2">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
