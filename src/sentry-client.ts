import axios, { AxiosInstance } from 'axios';
import { SentryIssue, SentryEvent } from './types.js';

export class SentryClient {
  private client: AxiosInstance;
  private orgSlug: string;

  constructor(authToken: string, orgSlug: string) {
    this.orgSlug = orgSlug;
    this.client = axios.create({
      baseURL: 'https://sentry.io/api/0',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List unresolved issues for a project
   */
  async listProjectIssues(
    projectSlug: string,
    options: {
      limit?: number;
      query?: string;
    } = {}
  ): Promise<SentryIssue[]> {
    const { limit = 25, query = 'is:unresolved' } = options;

    try {
      const response = await this.client.get(
        `/projects/${this.orgSlug}/${projectSlug}/issues/`,
        {
          params: {
            query,
            limit,
            statsPeriod: '14d',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Sentry issues:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific issue
   */
  async getIssueDetails(issueId: string): Promise<SentryIssue> {
    try {
      const response = await this.client.get(`/issues/${issueId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching issue ${issueId}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest event for an issue
   */
  async getLatestEvent(issueId: string): Promise<SentryEvent | null> {
    try {
      const response = await this.client.get(`/issues/${issueId}/events/`, {
        params: {
          limit: 1,
        },
      });

      if (response.data && response.data.length > 0) {
        const eventId = response.data[0].eventID;
        return this.getEventDetails(issueId, eventId);
      }

      return null;
    } catch (error) {
      console.error(`Error fetching latest event for issue ${issueId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed event information including stack traces
   */
  async getEventDetails(issueId: string, eventId: string): Promise<SentryEvent> {
    try {
      const response = await this.client.get(`/issues/${issueId}/events/${eventId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueId: string, comment: string): Promise<void> {
    try {
      await this.client.post(`/issues/${issueId}/comments/`, {
        text: comment,
      });
    } catch (error) {
      console.error(`Error adding comment to issue ${issueId}:`, error);
      throw error;
    }
  }

  /**
   * Update issue status (resolve, ignore, etc.)
   */
  async updateIssueStatus(
    issueId: string,
    status: 'resolved' | 'ignored' | 'unresolved'
  ): Promise<void> {
    try {
      await this.client.put(`/issues/${issueId}/`, {
        status,
      });
    } catch (error) {
      console.error(`Error updating issue ${issueId} status:`, error);
      throw error;
    }
  }
}
