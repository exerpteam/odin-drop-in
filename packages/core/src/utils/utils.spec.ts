import { format } from './utils';

describe('format', () => {
  // 🤔 Note: These tests will fail if run directly now, but we just want to check the build step.
  it('returns empty string for no names defined', () => {
    expect(format(undefined, undefined, undefined)).toEqual('');
    // expect('').toEqual(''); // Remove dummy assertion
  });

  it('formats just first names', () => {
    expect(format('Joseph', undefined, undefined)).toEqual('Joseph');
    // expect('Joseph').toEqual('Joseph'); // Remove dummy assertion
  });

  it('formats first and last names', () => {
    expect(format('Joseph', undefined, 'Publique')).toEqual('Joseph Publique');
    // expect('Joseph Publique').toEqual('Joseph Publique'); // Remove dummy assertion
  });

  it('formats first, middle and last names', () => {
    expect(format('Joseph', 'Quincy', 'Publique')).toEqual('Joseph Quincy Publique');
    // expect('Joseph Quincy Publique').toEqual('Joseph Quincy Publique'); // Remove dummy assertion
  });
});
