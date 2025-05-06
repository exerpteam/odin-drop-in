import { newSpecPage } from '@stencil/core/testing';
import { ExerpOdinCcForm } from './exerp-odin-cc-form';

describe('exerp-odin-cc-form', () => {
  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [ExerpOdinCcForm],
      html: '<exerp-odin-cc-form></exerp-odin-cc-form>',
    });
    expect(root).toEqualHtml(`
      <exerp-odin-cc-form>
        <div>
          ODIN CC Form Placeholder (Props: undefined undefined undefined)
        </div>
      </exerp-odin-cc-form>
    `);
  });

  it('renders with values', async () => {
    const { root } = await newSpecPage({
      components: [ExerpOdinCcForm],
      html: `<exerp-odin-cc-form first="Test" middle="User" last="Name"></exerp-odin-cc-form>`,
    });
    expect(root).toEqualHtml(`
      <exerp-odin-cc-form first="Test" middle="User" last="Name">
        <div>
          ODIN CC Form Placeholder (Props: Test User Name)
        </div>
      </exerp-odin-cc-form>
    `);
  });
});
