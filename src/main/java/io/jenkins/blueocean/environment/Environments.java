package io.jenkins.blueocean.environment;

import hudson.Extension;
import io.jenkins.blueocean.rest.OrganizationRoute;
import io.jenkins.blueocean.rest.hal.Link;
import io.jenkins.blueocean.rest.model.BlueOrganization;
import io.jenkins.blueocean.rest.model.Resource;
import org.kohsuke.stapler.Ancestor;
import org.kohsuke.stapler.Stapler;
import org.kohsuke.stapler.export.Exported;
import org.kohsuke.stapler.export.ExportedBean;

import java.util.ArrayList;
import java.util.List;

@Extension
@ExportedBean
public class Environments extends Resource implements OrganizationRoute {


    @Override
    public String getUrlName() {
        return "environments";
    }

    @Override
    public Link getLink() {
        return getOrganization().getLink().rel(getUrlName());
    }

    private static BlueOrganization getOrganization() {
        // This should always have an organization as a parent, as it's an OrganizationRoute
        Ancestor ancestor = Stapler.getCurrentRequest().findAncestor(BlueOrganization.class);
        BlueOrganization organization = (BlueOrganization)ancestor.getObject();
        return organization;
    }

    @Exported(inline=true)
    public String[] getEnvironments() throws Exception {
        List<String> info = new ArrayList<>();
        info.add(GlobalConfig.get().getDevelopmentDeployStageNames().replaceAll(", ", ",").toLowerCase());
        info.add(GlobalConfig.get().getQaDeployStageNames().replaceAll(", ", ",").toLowerCase());
        info.add(GlobalConfig.get().getProdDeployStageNames().replaceAll(", ", ",").toLowerCase());
        return info.toArray(new String[info.size()]);
    }
}