import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileSectionProps {
  email: string;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileSection({ email, errors, onChange }: ProfileSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={onChange}
        required
      />
      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
    </div>
  );
}