<h1>Find & Replace Using Powershell</h1>

Recently I was tasked with performing a find and replace across hundreds of files. The diff was to be submitted as a pull request, so a minimal set of changes to the files was desired.

I decided to try and use Powershell, and I was not expecting to run into as much trouble as I did.
 
To make a long story short, I ran into difficulties because not all files had the same end-of-line (EOL) semantics, and not all files had the same encoding. Preserving these semantics using Powershell proved to be painful.

<h2>Basic Approach</h2>

The basic approach to replacing text in Powershell is using the [Replace](https://blogs.technet.microsoft.com/heyscriptingguy/2011/03/21/use-powershell-to-replace-text-in-strings/) operator. The [Get-Content cmdlet](https://msdn.microsoft.com/en-us/powershell/reference/5.0/microsoft.powershell.management/get-content) is used to read a file, and the [Set-Content cmdlet](https://msdn.microsoft.com/en-us/powershell/reference/5.1/microsoft.powershell.management/set-content) is used to write text back to a file.

We can script up a simple Find-Replace script like this:

```
function Replace-Text($file, $find, $replace)
{
    $content = Get-Content $file
    if ($content -Match $find)
    {
        $content = $content -Replace $find, $replace
        Set-Content $file $content 
    }
}

gci *.txt -Recurse | ForEach-Object { 
    Replace-Text -FilePath $_ -Find 'find' -Replace 'replace' 
}
```

However, there are some problems here:
1) This approach will always append a new line to the end of the file
2) This approach will strip the [byte order marker (BOM)](https://en.wikipedia.org/wiki/Byte_order_mark) from the UTF8 encoding (note: I was only dealing with ANCII files and UTF-8 files with a BOM)

After running my replacement routine, a ```git diff``` revealed that in addition to performing the replacement, I added an extra new  line to files that had no trailing new line initially, and stripped away the BOM from files that began with it.

<h2>Preserving End Of File New Line Semantics</h2>

The strategy here is just to switch to the popular ```ReadAllText``` and ```WriteAllText``` methods in .NET:

```
function Replace-Text($file, $find, $replace)
{
    $content = [IO.File]::ReadAllText($file)
    if ($content -Match $find)
    {
        $content = $content -Replace $find, $replace
        [IO.File]::WriteAllText($file, $content)
    }
}
```

Alternatively, you could try to use the [-NoNewLine](https://blogs.technet.microsoft.com/heyscriptingguy/2015/08/07/the-powershell-5-nonewline-parameter/) parameter introduced in Powershell 5, but I found this flag was stripping all new lines.

<h2>Preserving File Encoding</h2>

This one is a bit trickier, because you first have to detect the encoding, and then use the same encoding to write back to the file. I used the following [script](https://gist.github.com/jpoehls/2406504) to detect a file's encoding.

```
function Get-FileEncoding
{
    [CmdletBinding()] 
    Param (
    [Parameter(Mandatory = $True, ValueFromPipelineByPropertyName = $True)] 
    [string]$Path
    )

    [byte[]]$byte = get-content -Encoding byte -ReadCount 4 -TotalCount 4 -Path $Path

    # EF BB BF (UTF8)
    if ( $byte[0] -eq 0xef -and $byte[1] -eq 0xbb -and $byte[2] -eq 0xbf )
    { Write-Output 'UTF8' }

    # FE FF  (UTF-16 Big-Endian)
    elseif ($byte[0] -eq 0xfe -and $byte[1] -eq 0xff)
    { Write-Output 'Unicode UTF-16 Big-Endian' }

    # FF FE  (UTF-16 Little-Endian)
    elseif ($byte[0] -eq 0xff -and $byte[1] -eq 0xfe)
    { Write-Output 'Unicode UTF-16 Little-Endian' }

    # 00 00 FE FF (UTF32 Big-Endian)
    elseif ($byte[0] -eq 0 -and $byte[1] -eq 0 -and $byte[2] -eq 0xfe -and $byte[3] -eq 0xff)
    { Write-Output 'UTF32 Big-Endian' }

    # FE FF 00 00 (UTF32 Little-Endian)
    elseif ($byte[0] -eq 0xfe -and $byte[1] -eq 0xff -and $byte[2] -eq 0 -and $byte[3] -eq 0)
    { Write-Output 'UTF32 Little-Endian' }

    # 2B 2F 76 (38 | 38 | 2B | 2F)
    elseif ($byte[0] -eq 0x2b -and $byte[1] -eq 0x2f -and $byte[2] -eq 0x76 -and ($byte[3] -eq 0x38 -or $byte[3] -eq 0x39 -or $byte[3] -eq 0x2b -or $byte[3] -eq 0x2f) )
    { Write-Output 'UTF7'}

    # F7 64 4C (UTF-1)
    elseif ( $byte[0] -eq 0xf7 -and $byte[1] -eq 0x64 -and $byte[2] -eq 0x4c )
    { Write-Output 'UTF-1' }

    # DD 73 66 73 (UTF-EBCDIC)
    elseif ($byte[0] -eq 0xdd -and $byte[1] -eq 0x73 -and $byte[2] -eq 0x66 -and $byte[3] -eq 0x73)
    { Write-Output 'UTF-EBCDIC' }

    # 0E FE FF (SCSU)
    elseif ( $byte[0] -eq 0x0e -and $byte[1] -eq 0xfe -and $byte[2] -eq 0xff )
    { Write-Output 'SCSU' }

    # FB EE 28  (BOCU-1)
    elseif ( $byte[0] -eq 0xfb -and $byte[1] -eq 0xee -and $byte[2] -eq 0x28 )
    { Write-Output 'BOCU-1' }

    # 84 31 95 33 (GB-18030)
    elseif ($byte[0] -eq 0x84 -and $byte[1] -eq 0x31 -and $byte[2] -eq 0x95 -and $byte[3] -eq 0x33)
    { Write-Output 'GB-18030' }

    else
    { Write-Output 'ASCII' }
}

function Replace-Text($file, $find, $replace)
{
    $parsedEncoding = Get-FileEncoding $FilePath
    if ($parsedEncoding -like "ASCII")
    {
        $encoding = New-Object System.Text.ASCIIEncoding
    }
    elseif ($parsedEncoding -like "UTF8")
    {
        # Always add back the BOM marker.
        $encoding = New-Object System.Text.UTF8Encoding $True
    }
    else
    {
        throw "Unrecognized encoding '$parsedEncoding'"
    }
    
    $content = [IO.File]::ReadAllText($file)
    if ($content -Match $find)
    {
        $content = $content -Replace $find, $replace
        [IO.File]::WriteAllText($file, $content, $encoding)
    }
}
```

This find and replace function will preserve end of line semantics and will not strip the BOM from UTF-8 files. Note that if you are dealing with UTF-8 files without BOMs, this will not be sufficient because ```Get-FileEncoding``` will detect the file as ASCII.

However, According to the [Unicode standard](http://www.unicode.org/versions/Unicode5.0.0/ch02.pdf), the BOM for UTF-8 files is not recommended:

```
2.6 Encoding Schemes

... Use of a BOM is neither required nor recommended for UTF-8, but may be encountered in contexts where UTF-8 data is converted from other encoding forms that use a BOM or where the BOM is used as a UTF-8 signature. See the “Byte Order Mark” subsection in Section 16.8, Specials, for more information.
```
