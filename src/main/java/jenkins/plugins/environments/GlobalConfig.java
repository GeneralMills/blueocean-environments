package jenkins.plugins.environments;

import hudson.Extension;
import net.sf.json.JSONObject;
import jenkins.model.GlobalConfiguration;
import org.kohsuke.stapler.QueryParameter;
import org.kohsuke.stapler.StaplerRequest;
import org.kohsuke.stapler.DataBoundConstructor;
import hudson.util.FormValidation;
import hudson.model.Descriptor.FormException;


@Extension
public class GlobalConfig extends GlobalConfiguration {

    public static GlobalConfig get() {
        return GlobalConfiguration.all().get(GlobalConfig.class);
    }

    private String developmentDeployStageNames;
    private String qaDeployStageNames;
    private String prodDeployStageNames;

    public GlobalConfig() {
        load();
    }

    @Override
    public boolean configure(StaplerRequest req, JSONObject json) throws FormException {
        req.bindJSON(this, json);
        return true;
    }

    public String getDevelopmentDeployStageNames() {
        return developmentDeployStageNames;
    }

    public void setDevelopmentDeployStageNames(String developmentDeployStageNames) {
        this.developmentDeployStageNames = developmentDeployStageNames;
        save();
    }

    public String getQaDeployStageNames() {
        return qaDeployStageNames;
    }

    public void setQaDeployStageNames(String qaDeployStageNames) {
        this.qaDeployStageNames = qaDeployStageNames;
        save();
    }

    public String getProdDeployStageNames() {
        return prodDeployStageNames;
    }

    public void setProdDeployStageNames(String prodDeployStageNames) {
        this.prodDeployStageNames = prodDeployStageNames;
        save();
    }

    public FormValidation doCheckDevelopmentDeployStageNames(@QueryParameter String value) {
        if (value == null || value.trim().isEmpty())
            return FormValidation.warning("Please set a Development Deploy stage name");

        return FormValidation.ok();
    }
}