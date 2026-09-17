const config = {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"],
  // tsc는 프로젝트 전체 타입을 봐야 하므로 파일 목록을 넘기지 않고 항상 전체 체크
  "*.{ts,tsx}": () => "tsc --noEmit",
};

export default config;
