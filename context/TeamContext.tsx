import React, { createContext, useContext, useState } from "react";

type TeamData = {
  teamName: string;
  grade: string;
  teamId: string;
  rank: number | null;
  score: number | null;
  teamMembers: string[];
  setTeamName: (v: string) => void;
  setGrade: (v: string) => void;
  setTeamId: (v: string) => void;
  setRank: (v: number | null) => void;
  setScore: (v: number | null) => void;
  setTeamMembers: (v: string[]) => void;
};

const TeamContext = createContext<TeamData>({} as TeamData);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teamName, setTeamName] = useState("");
  const [grade, setGrade] = useState("");
  const [teamId, setTeamId] = useState("");
  const [rank, setRank] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  return (
    <TeamContext.Provider
      value={{
        teamName,
        grade,
        teamId,
        rank,
        score,
        teamMembers,
        setTeamName,
        setGrade,
        setTeamId,
        setRank,
        setScore,
        setTeamMembers,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);
