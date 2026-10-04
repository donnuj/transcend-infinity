// Reset module-level state between tests
beforeEach(() => {
  localStorage.clear();
  document.cookie = "ti_session=; path=/; max-age=0";
  document.cookie = "ti_offline=; path=/; max-age=0";
});
