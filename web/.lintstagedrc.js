const config = {
  '*.{ts,tsx,js,jsx}': filenames => {
    const files = filenames.join(' ');
    return [
      `eslint --fix ${files}`,
      `prettier --write ${files}`,
      `git add ${files}`,
    ];
  },
  '*.{json,md,css}': filenames => {
    const files = filenames.join(' ');
    return [`prettier --write ${files}`, `git add ${files}`];
  },
};

export default config;
