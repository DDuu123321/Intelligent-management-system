// src/api/auth.ts
import request from "@/utils/request";
import type {
  BaseResponse,
  LoginRequest,
  LoginResponse,
  UserProfile,
} from "@/types/api";

// 用户登录
export const login = (data: LoginRequest) => {
  return request.post<BaseResponse<LoginResponse>, BaseResponse<LoginResponse>>(
    "/auth/login",
    data,
  );
};

// 获取用户信息
export const getUserInfo = () => {
  return request.get<BaseResponse<UserProfile>>("/auth/profile");
};

// 用户登出
export const logout = () => {
  return request.post<BaseResponse<null>>("/auth/logout");
};

// 更新用户信息
export const updateProfile = (
  data: Partial<Pick<UserProfile, "name" | "email" | "phone">>,
) => {
  return request.put<BaseResponse<UserProfile>>("/auth/profile", data);
};
