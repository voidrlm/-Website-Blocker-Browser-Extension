chrome.action.onClicked.addListener((tab) => {
  const url = new URL(tab.url);
  const domain = url.hostname;
  chrome.storage.local.get({ blockedDomains: [] }, (result) => {
    const blockedDomains = result.blockedDomains;
    if (!blockedDomains.includes(domain)) {
      blockedDomains.push(domain);
      chrome.storage.local.set({ blockedDomains }, () => {
        updateBlockRules(blockedDomains, tab.id);
      });
    } else {
      // Refresh the page to apply the block immediately if already blocked
      if (tab.id) {
        chrome.tabs.reload(tab.id);
      }
    }
  });
});

function updateBlockRules(blockedDomains, tabId) {
  // Clear existing rules first
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: Array.from(
        { length: blockedDomains.length + 1 },
        (_, i) => i + 1
      ),
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error removing rules: ", chrome.runtime.lastError);
        return;
      }

      // Add new blocking rules
      const rules = blockedDomains.map((domain, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: `*://${domain}/*`,
          resourceTypes: ["main_frame"],
        },
      }));

      chrome.declarativeNetRequest.updateDynamicRules(
        {
          addRules: rules,
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Error adding rules: ", chrome.runtime.lastError);
            return;
          }
          // Force reload the tab to apply the block
          if (tabId) {
            chrome.tabs.reload(tabId);
          }
        }
      );
    }
  );
  console.log("WEBSITE BLOCKER READY");
}

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get({ blockedDomains: [] }, (result) => {
    updateBlockRules(result.blockedDomains);
  });
});
