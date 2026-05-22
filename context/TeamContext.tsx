import React, { createContext, useContext, useState } from "react";

type TeamData = {
  teamName: string;
  grade: string;
  teamId: string;
  rank: number | null;
  setTeamName: (v: string) => void;
  setGrade: (v: string) => void;
  setTeamId: (v: string) => void;
  setRank: (v: number | null) => void;
};

const TeamContext = createContext<TeamData>({} as TeamData);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teamName, setTeamName] = useState("");
  const [grade, setGrade] = useState("");
  const [teamId, setTeamId] = useState("");
  const [rank, setRank] = useState<number | null>(null);

  return (
    <TeamContext.Provider
      value={{
        teamName,
        grade,
        teamId,
        rank,
        setTeamName,
        setGrade,
        setTeamId,
        setRank,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);
