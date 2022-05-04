import Fontmin from 'fontmin';

export function getMinFont(fontFile: Buffer, txtSet: string) {
  return new Promise((resolve, reject) => {
    const font = new Fontmin();

    font
      .src(fontFile)
      .use(Fontmin.ttf2woff2())
      .run((err, files) => {
        if (err) {
          reject(err);
        }

        // TODO:
        console.log(files[0]);
      });
  });
}
