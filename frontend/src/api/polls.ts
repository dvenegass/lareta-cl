import type { Poll } from "../types";
import { request } from "./client";

export const listPolls = (eventId: string) => request<Poll[]>(`/events/${eventId}/polls/`);

export const createPoll = (eventId: string, data: { question: string; options: string[] }) =>
  request<Poll>(`/events/${eventId}/polls/`, { method: "POST", body: data });

export const deletePoll = (pollId: number) => request<void>(`/polls/${pollId}/`, { method: "DELETE" });

export const vote = (pollId: number, optionId: number) =>
  request<Poll>(`/polls/${pollId}/vote/`, { method: "PUT", body: { option: optionId } });

export const removeVote = (pollId: number) => request<Poll>(`/polls/${pollId}/vote/`, { method: "DELETE" });
