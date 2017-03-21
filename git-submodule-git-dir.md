A git submodule is another git repository cloned down into a subpath of the super repository. However, there are some oddities with how a submodule's git metadata is stored. These oddities have implicatations for how one runs git commands in the submodule from outside the submodule directory.

For these examples, I have a repository located at ```D:\Testing```, and a submodule located at ```D:\Testing\Utility```

<h2>Where is the .git directory?</h2>

```
D:\Testing> git rev-parse --git-dir
.git

D:\Testing\Utility> git rev-parse --git-dir
D:/Testing/.git/modules/Utility
```

However, if the submodule was cloned manually prior to the creation of the submodule, the ```.git``` directory of the submodule would be at ```D:\Testing\Utility.git``` instead. The [absorb-git-dirs](https://git-scm.com/docs/git-submodule#git-submodule-absorbgitdirs) flag can be used to move the ```.git``` directory from inside the submodule to inside the super repository:

> If a git directory of a submodule is inside the submodule, move the git directory of the submodule into its superprojects $GIT_DIR/modules path and then connect the git directory and its working directory by setting the core.worktree and adding a .git file pointing to the git directory embedded in the superprojects git directory.

> A repository that was cloned independently and later added as a submodule or old setups have the submodules git directory inside the submodule instead of embedded into the superprojects git directory.
