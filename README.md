# Jenkins Blue Ocean Environments

Adds a page to Blue Ocean that displays what environments (Dev, QA, Prod) a pipeline has been deployed to.

## Overview

It uses stage names to determine what constitutes a deploy to an environment.  A successful "Development" step may mean
that the pipeline has made it to Development. Since stage names are flexible, the stage names that represent Dev, QA,
and Prod can be configured on the global configuration page.  It is a comma delimited list of names. 

## Local Plugin Development Setup  

1. Make sure `JDK` is installed and the version is greater than 1.8. Use `javac --version` to check the version.
2. Make sure `mvn` is install and is greater than 3 by using `mvn --version`.
3. Check `mvn` settings for Jenkins plugin development.  Use the following guide to change your .m2/settings.xml for plugin development. [https://wiki.jenkins.io/display/JENKINS/Plugin+tutorial#Plugintutorial-SettingUpEnvironment](https://wiki.jenkins.io/display/JENKINS/Plugin+tutorial#Plugintutorial-SettingUpEnvironment)
4. Run `mvn clean install` to bring in all dependencies.
    * You may run into an error like `Cannot find module '@jenkins-cd/react-material-icons'`, you could get around this by installing that module to another location and copying into your node_modules folder.
5. Run `mvn hpi:run` in root of git repository directory
6. Navigate to localhost:8080/jenkins and install Blue Ocean 1.5 by going to the following link and downloading the 1.5 .hpi. Then install it by going to Manage Jenkins > Manage Plugins > Advanced > Upload Plugin.
    * https://updates.jenkins.io/download/plugins/blueocean/
7. Restart Jenkins by entering the `mvn hpi:run` command, and re-running it.
8. Setup environments in local Jenkins instance under Manage Jenkins > Configure System.
    ![Alt text](/docs/environmentsetup.png)

## Package & Install Jenkins Plugin
To package up and install the plugin on Jenkins:
1. Run `mvn package -DskipTests` to package up the hpi file.
2. Take the hpi file from the `target` folder.
2. Navigate to the Jenkins instance and go to Manage Jenkins > Manage Plugins > Advanced > Upload Plugin and upload the hpi file from the `target` folder.