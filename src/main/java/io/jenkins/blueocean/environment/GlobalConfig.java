package io.jenkins.blueocean.environment;

import hudson.Extension;
import net.sf.json.JSONObject;
import jenkins.model.GlobalConfiguration;
import org.kohsuke.stapler.QueryParameter;
import org.kohsuke.stapler.StaplerRequest;
import hudson.util.FormValidation;

@Extension
public class GlobalConfig extends GlobalConfiguration {

    public static GlobalConfig get() {
        return GlobalConfiguration.all().get(GlobalConfig.class);
    }

    private String deployStageNames;

    public GlobalConfig() {
        load();
    }

    @Override
    public boolean configure(StaplerRequest req, JSONObject json) throws FormException {
        req.bindJSON(this, json);
        return true;
    }

    public String getDeployStageNames() {
        return deployStageNames;
    }

    public void setDeployStageNames(String deployStageNames) {
        this.deployStageNames = deployStageNames;
        save();
    }

    public FormValidation doCheckdeployStageNames(@QueryParameter String value) {
        if (value == null || value.trim().isEmpty())
            return FormValidation.warning("Please set a Deploy stage name");

        return FormValidation.ok();
    }
}