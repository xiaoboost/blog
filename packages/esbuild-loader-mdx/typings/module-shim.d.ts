declare module '@mdx-js/mdx' {
  function render(mdx: string): Promise<string>;
  export default render;
}
