import { toAst } from '../../src/cst';
import { extname, join } from 'path';
import { lstatSync, readdirSync, readFileSync } from 'fs';

const DUST_FILES_DIR = join(__dirname, 'dust');
const DUST_FILES = readdirSync(DUST_FILES_DIR)
  .filter(fileName => {
    const path = `${DUST_FILES_DIR}/${fileName}`;

    return (
      extname(fileName) !== '.snap' &&
      lstatSync(path).isFile() &&
      fileName[0] !== '.'
    );
  })
  .map(fileName => {
    const path = `${DUST_FILES_DIR}/${fileName}`;
    return [fileName.slice(0, -3), readFileSync(path, 'utf8')];
  });

describe('toAst', () => {
  test.each(DUST_FILES)('%s', (testName, fileSource) => {
    // if(testName === 'exists')
    expect(toAst(fileSource)).toMatchSnapshot();
  });
});
