/**
 * fork from mock-require
 * @link: https://github.com/boblauer/mock-require
 */

import { active } from './require';

active();

export { addExport as mock, removeExport as stop, clear as stopAll } from './exports';
