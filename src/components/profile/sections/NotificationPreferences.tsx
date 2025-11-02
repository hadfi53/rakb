
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NotificationPreferences as Preferences } from '@/types/user';

interface NotificationPreferencesProps {
  preferences: Preferences;
  onChange: (preferences: Preferences) => void;
}

export const NotificationPreferences = ({ preferences, onChange }: NotificationPreferencesProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Préférences de notification</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="emailNotif">Notifications par email</Label>
          <Switch
            id="emailNotif"
            checked={preferences.email}
            onCheckedChange={(checked) => 
              onChange({ ...preferences, email: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="smsNotif">Notifications par SMS</Label>
          <Switch
            id="smsNotif"
            checked={preferences.sms}
            onCheckedChange={(checked) => 
              onChange({ ...preferences, sms: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="pushNotif">Notifications push</Label>
          <Switch
            id="pushNotif"
            checked={preferences.push}
            onCheckedChange={(checked) => 
              onChange({ ...preferences, push: checked })}
          />
        </div>
      </div>
    </div>
  );
};
