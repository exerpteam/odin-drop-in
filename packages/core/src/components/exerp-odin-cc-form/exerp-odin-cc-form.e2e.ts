import { newE2EPage } from '@stencil/core/testing';

describe('exerp-odin-cc-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<exerp-odin-cc-form></exerp-odin-cc-form>');
    const element = await page.find('exerp-odin-cc-form');
    expect(element).toHaveClass('hydrated');
  });

  it('renders changes to the name data', async () => {
    const page = await newE2EPage();

    await page.setContent('<exerp-odin-cc-form></exerp-odin-cc-form>');
    const component = await page.find('exerp-odin-cc-form');
    const element = await page.find('exerp-odin-cc-form >>> div');
    expect(element.textContent).toEqual(`ODIN CC Form Placeholder (Props: undefined undefined undefined)`);

    component.setProperty('first', 'James');
    await page.waitForChanges();
    expect(element.textContent).toEqual(`ODIN CC Form Placeholder (Props: James undefined undefined)`);

    component.setProperty('last', 'Quincy');
    await page.waitForChanges();
    expect(element.textContent).toEqual(`ODIN CC Form Placeholder (Props: James undefined Quincy)`);

    component.setProperty('middle', 'Earl');
    await page.waitForChanges();
    expect(element.textContent).toEqual(`ODIN CC Form Placeholder (Props: James Earl Quincy)`);
  });
});
