<b>Resolving Submodule Merge Conflicts</b>

If the submodule commit diverges independently in some set of branches, this introduces the possibility of merge conflicts within the submodule path when these branches are merged.

```
> git status
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   <submodule>
```

This status message will appear regardless of the [ignore](https://git-scm.com/docs/gitmodules#gitmodules-submoduleltnamegtignore) setting of the submodule, because this conflict represents a conflict in the main repository, not the submodule itself.

Run ```git diff``` to discover what the conflicting commits are. There are two possible outputs:

<i>1) The submodule repository exists on disk</i>

```
> git diff
diff --cc <submodule>
index <commit1>,<commit2>..0000000
--- a/<submodule>
+++ b/<submodule>
```

<i>2) The submodule does not exist on disk</i>

```
> git diff
- Subproject commit <commit1>
 -Subproject commit <commit2>
++Subproject commit 0000000000000000000000000000000000000000
```

