import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { t } = useLanguage();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Dane formularza logowania
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });
  
  // Dane formularza rejestracji
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    company: ""
  });
  
  // Obsługa zmiany pól formularza logowania
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };
  
  // Obsługa zmiany pól formularza rejestracji
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };
  
  // Obsługa logowania
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };
  
  // Obsługa rejestracji
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };
  
  // Przekieruj do głównej strony jeśli użytkownik jest zalogowany
  if (user) {
    return <Redirect to="/" />;
  }
  
  const isLoginDisabled = !loginData.username || !loginData.password || loginMutation.isPending;
  const isRegisterDisabled = !registerData.username || !registerData.password || 
                            !registerData.email || !registerData.fullName || registerMutation.isPending;
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              {t('cad_viewer')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('powered_by')} <a href="https://fastcnc.eu" className="font-medium text-primary hover:text-primary/90">FastCNC</a>
            </p>
          </div>

          <div className="mt-8">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('login')}</TabsTrigger>
                <TabsTrigger value="register">{t('register')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('login')}</CardTitle>
                    <CardDescription>{t('enter_credentials')}</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">{t('username')}</Label>
                        <Input 
                          id="username" 
                          name="username" 
                          value={loginData.username} 
                          onChange={handleLoginChange} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">{t('password')}</Label>
                        <Input 
                          id="password" 
                          name="password" 
                          type="password" 
                          value={loginData.password} 
                          onChange={handleLoginChange} 
                          required 
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoginDisabled}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {t('login')}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('register')}</CardTitle>
                    <CardDescription>{t('create_account')}</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-username">{t('username')} *</Label>
                        <Input 
                          id="reg-username" 
                          name="username" 
                          value={registerData.username} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">{t('email')} *</Label>
                        <Input 
                          id="reg-email" 
                          name="email" 
                          type="email" 
                          value={registerData.email} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-fullName">{t('full_name')} *</Label>
                        <Input 
                          id="reg-fullName" 
                          name="fullName" 
                          value={registerData.fullName} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-company">{t('company')}</Label>
                        <Input 
                          id="reg-company" 
                          name="company" 
                          value={registerData.company} 
                          onChange={handleRegisterChange} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">{t('password')} *</Label>
                        <Input 
                          id="reg-password" 
                          name="password" 
                          type="password" 
                          value={registerData.password} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isRegisterDisabled}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {t('register')}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Hero sekcja */}
      <div className="relative flex-1 hidden w-0 lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/90 to-primary/40 p-8">
          <div className="max-w-2xl text-center text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t('cad_viewer')}
            </h1>
            <p className="mt-6 text-xl">
              {t('app_description')}
            </p>
            <div className="mt-8 flex flex-col space-y-4">
              <div className="flex items-center bg-white/10 p-4 rounded-lg">
                <div className="rounded-full bg-white/20 p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{t('feature_1_title')}</h3>
                  <p className="text-white/80 text-sm">{t('feature_1_desc')}</p>
                </div>
              </div>
              <div className="flex items-center bg-white/10 p-4 rounded-lg">
                <div className="rounded-full bg-white/20 p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{t('feature_2_title')}</h3>
                  <p className="text-white/80 text-sm">{t('feature_2_desc')}</p>
                </div>
              </div>
              <div className="flex items-center bg-white/10 p-4 rounded-lg">
                <div className="rounded-full bg-white/20 p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{t('feature_3_title')}</h3>
                  <p className="text-white/80 text-sm">{t('feature_3_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}