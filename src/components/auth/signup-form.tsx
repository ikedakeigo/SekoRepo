/**
 * 新規登録フォームコンポーネント
 */

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * 新規登録フォーム
 */
export const SignupForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // フォーム値を保持
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 入力フィールドへの参照
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    // 入力時にそのフィールドのエラーをクリア
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{8,}$/;

    if (!formValues.name.trim()) {
      errors.name = "お名前を入力してください";
    }

    if (!formValues.email.trim()) {
      errors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      errors.email = "有効なメールアドレスを入力してください";
    }

    if (!formValues.password) {
      errors.password = "パスワードを入力してください";
    } else if (!passwordRegex.test(formValues.password)) {
      errors.password =
        "パスワードは8文字以上で、小文字・数字を含めてください";
    }

    if (!formValues.confirmPassword) {
      errors.confirmPassword = "パスワード（確認）を入力してください";
    } else if (formValues.password !== formValues.confirmPassword) {
      errors.confirmPassword = "パスワードが一致しません";
    }

    setFieldErrors(errors);

    // 最初のエラーフィールドにフォーカス
    if (errors.name) {
      nameRef.current?.focus();
      return false;
    }
    if (errors.email) {
      emailRef.current?.focus();
      return false;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return false;
    }
    if (errors.confirmPassword) {
      confirmPasswordRef.current?.focus();
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", formValues.name);
      formData.append("email", formValues.email);
      formData.append("password", formValues.password);

      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
        // メールアドレス関連のエラーの場合
        if (result.error.includes("メールアドレス")) {
          setFieldErrors({ email: result.error });
          emailRef.current?.focus();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputErrorClass = (hasError: boolean) =>
    cn(hasError && "border-red-500 focus-visible:ring-red-500");

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">SekoRepo</CardTitle>
        <CardDescription className="text-center">
          新規アカウント登録
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && !Object.keys(fieldErrors).length && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">お名前</Label>
            <Input
              ref={nameRef}
              id="name"
              name="name"
              type="text"
              placeholder="山田 太郎"
              autoComplete="name"
              value={formValues.name}
              onChange={handleChange}
              className={inputErrorClass(!!fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-500">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              placeholder="example@example.com"
              autoComplete="email"
              value={formValues.email}
              onChange={handleChange}
              className={inputErrorClass(!!fieldErrors.email)}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <div className="relative">
              <Input
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="8文字以上（小文字・数字を含む）"
                autoComplete="new-password"
                value={formValues.password}
                onChange={handleChange}
                className={cn("pr-10", inputErrorClass(!!fieldErrors.password))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-xs text-red-500">{fieldErrors.password}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                小文字・数字を含む8文字以上
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">パスワード（確認）</Label>
            <div className="relative">
              <Input
                ref={confirmPasswordRef}
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="もう一度入力"
                autoComplete="new-password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                className={cn(
                  "pr-10",
                  inputErrorClass(!!fieldErrors.confirmPassword)
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-500">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登録中...
              </>
            ) : (
              "新規登録"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          既にアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-primary hover:underline">
            ログイン
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
