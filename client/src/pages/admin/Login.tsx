import cafeLogo from "@/assets/cafe-logo-dark.png";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Coffee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutate: login, isPending, error } = useLogin();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) setLocation("/admin/dashboard");
  }, [user, setLocation]);

  const onSubmit = (data: LoginData) => {
    login(data);
  };

  if (isUserLoading) return null;

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-stone-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 mb-4">
            <img 
              src={cafeLogo} 
              alt="Cafe Twenty Twenty" 
              className="w-full h-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold font-display text-stone-800">Cafe Twenty Twenty</h1>
          <p className="text-stone-500 text-sm">Management System</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600">Username</label>
            <Input 
              {...form.register("username")}
              className="bg-stone-50 h-11"
              autoComplete="username"
            />
            {form.formState.errors.username && (
              <p className="text-red-500 text-xs">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600">Password</label>
            <Input 
              {...form.register("password")}
              type="password"
              className="bg-stone-50 h-11"
              autoComplete="current-password"
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-xs">{form.formState.errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error.message}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full h-11 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
