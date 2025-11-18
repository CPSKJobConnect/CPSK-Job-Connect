describe("loaderSignal registry", () => {
  const loadModule = () => require("@/lib/loaderSignal");

  beforeEach(() => {
    jest.resetModules();
  });

  it("tracks pending count via begin/done", () => {
    const { begin, done, getPending } = loadModule();

    expect(getPending()).toBe(0);
    begin();
    begin();
    expect(getPending()).toBe(2);
    done();
    expect(getPending()).toBe(1);
    done();
    expect(getPending()).toBe(0);
    done();
    expect(getPending()).toBe(0);
  });

  it("notifies subscribers on changes", () => {
    const { begin, done, subscribe } = loadModule();
    const listener = jest.fn();
    const unsubscribe = subscribe(listener);

    begin();
    begin();
    done();
    unsubscribe();
    begin();

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenNthCalledWith(1, 1);
    expect(listener).toHaveBeenNthCalledWith(2, 2);
    expect(listener).toHaveBeenNthCalledWith(3, 1);
  });
});
