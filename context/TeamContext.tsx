import React, { createContext, useContext, useState } from "react";

type TeamData = {
  teamName: string;
  grade: string;
  teamId: string;
  setTeamName: (v: string) => void;
  setGrade: (v: string) => void;
  setTeamId: (v: string) => void;
};

const TeamContext = createContext<TeamData>({} as TeamData);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teamName, setTeamName] = useState("");
  const [grade, setGrade] = useState("");
  const [teamId, setTeamId] = useState("");

  return (
    <TeamContext.Provider
      value={{ teamName, grade, teamId, setTeamName, setGrade, setTeamId }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);
