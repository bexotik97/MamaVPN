import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

type MarzbanTokenResponse = {
  access_token: string;
  token_type: string;
};

@Injectable()
export class MarzbanService {
  private readonly logger = new Logger(MarzbanService.name);
  private readonly client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.MARZBAN_BASE_URL,
      timeout: 10000
    });
  }

  private async ensureToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    const params = new URLSearchParams();
    params.set("username", process.env.MARZBAN_USERNAME ?? "");
    params.set("password", process.env.MARZBAN_PASSWORD ?? "");

    const response = await this.client.post<MarzbanTokenResponse>(
      "/api/admin/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    this.accessToken = response.data.access_token;
    return this.accessToken;
  }

  private async request<T>(method: "get" | "post" | "put", url: string, data?: unknown) {
    const token = await this.ensureToken();

    const response = await this.client.request<T>({
      method,
      url,
      data,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  }

  async createUser(input: {
    username: string;
    expire: number;
    dataLimit: number;
    note: string;
    inboundTag: string;
  }) {
    const payload = {
      username: input.username,
      proxies: {
        vless: {}
      },
      inbounds: {
        vless: [input.inboundTag]
      },
      expire: input.expire,
      data_limit: input.dataLimit,
      note: input.note
    };

    return this.request<Record<string, unknown>>("post", "/api/user", payload);
  }

  async getUser(username: string) {
    return this.request<Record<string, unknown>>("get", `/api/user/${username}`);
  }

  async modifyUser(
    username: string,
    payload: {
      expire?: number;
      data_limit?: number;
      status?: string;
    }
  ) {
    return this.request<Record<string, unknown>>("put", `/api/user/${username}`, payload);
  }

  async suspendUser(username: string) {
    this.logger.warn(`Suspending Marzban user ${username}`);
    return this.modifyUser(username, { status: "disabled" });
  }

  async resumeUser(username: string) {
    return this.modifyUser(username, { status: "active" });
  }
}
