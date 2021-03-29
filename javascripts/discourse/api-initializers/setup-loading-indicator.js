import { apiInitializer } from "discourse/lib/api";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { observes } from "discourse-common/utils/decorators";
import DiscourseURL from "discourse/lib/url";
import { set } from "@ember/object";
import { isAppWebview } from "discourse/lib/utilities";

export default apiInitializer("0.8", (api) => {
  api.modifyClass("route:application", {
    loadingIndicator: service(),

    @action
    loading(transition) {
      this.loadingIndicator.start();
      transition.promise.finally(() => {
        this.loadingIndicator.end();
      });

      return true;
    },
  });

  api.modifyClass("component:scrolling-post-stream", {
    // Core currently relies on the intermediate loading screen to reload the scrolling-post-stream
    // component. This change should probably be made in core, but keeping it here for now.
    @observes("posts")
    _postsChanged() {
      this.queueRerender();
    },
  });

  if (isAppWebview()) {
    document.body.classList.add("discourse-hub-webview");
  }

  // Remove the custom refresh implementation and use the router
  api.modifyClass("controller:discovery/topics", {
    @action
    refresh() {
      this.send("triggerRefresh");
    },
  });

  api.modifyClass("route:discovery", {
    @action
    triggerRefresh() {
      this.refresh();
    },
  });
});
