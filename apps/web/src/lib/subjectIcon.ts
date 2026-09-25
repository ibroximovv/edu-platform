import { Binary, BookOpen, Brain, Code2, Cpu, Database, GitBranch, Globe, Languages, Lock, Network, PenTool, Sigma, type LucideIcon } from 'lucide-react';

const RULES: [RegExp, LucideIcon][] = [
  [/python|dasturlash asos/i, Code2],
  [/algoritm|tuzilma/i, GitBranch],
  [/web|react|frontend/i, Globe],
  [/baza|sql|postgres/i, Database],
  [/ui|ux|dizayn/i, PenTool],
  [/intellekt|ai|machine/i, Brain],
  [/diskret/i, Binary],
  [/matemat|algebra|analiz/i, Sigma],
  [/tarmoq|network/i, Network],
  [/operatsion|linux/i, Cpu],
  [/kripto|xavfsiz/i, Lock],
  [/ingliz|til|english/i, Languages],
];

export function subjectIcon(name: string): LucideIcon {
  return RULES.find(([re]) => re.test(name))?.[1] ?? BookOpen;
}
